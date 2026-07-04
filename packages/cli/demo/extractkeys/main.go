// Command extract-keys slices individual keystroke samples out of a continuous
// typing recording. It detects transients in <src.wav> and writes one short WAV
// per keystroke into <out_dir>/keyNN.wav (1 ms fade-in, ~45 ms fade-out so the
// edges don't click).
//
// Usage:  extract-keys <src.wav> <out_dir>
//
// Ported from the original extract_keys.py.
package main

import (
	"fmt"
	"math"
	"os"
	"path/filepath"

	"velix/demo/internal/audio"
)

const sr = audio.SampleRate

// srf is the same rate as a runtime float64 so int(srf*fraction) truncates like
// Python's int() (a constant int(sr*0.003) would be rejected at compile time).
var srf = float64(sr)

// detectOnsets finds keystroke start indices: it smooths |a| over a 3 ms window,
// thresholds at a fraction of the peak, and keeps rising edges at least min_gap
// apart.
func detectOnsets(a []float64, minGap, thrFrac float64) []int {
	win := int(srf * 0.003)
	sm := audio.MovingAvg(absOf(a), win)
	peak := audio.MaxAbs(sm)
	thr := thrFrac * peak

	above := make([]bool, len(sm))
	for i, v := range sm {
		above[i] = v > thr
	}

	var out []int
	last := -10 * sr
	gap := int(sr * minGap)
	for j := 0; j+1 < len(above); j++ {
		if above[j+1] && !above[j] { // rising edge
			if j-last > gap {
				out = append(out, j)
				last = j
			}
		}
	}
	return out
}

func absOf(a []float64) []float64 {
	out := make([]float64, len(a))
	for i, v := range a {
		out[i] = math.Abs(v)
	}
	return out
}

func main() {
	if len(os.Args) < 3 {
		fmt.Fprintln(os.Stderr, "usage: extract-keys <src.wav> <out_dir>")
		os.Exit(2)
	}
	src, outDir := os.Args[1], os.Args[2]
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		fatal(err)
	}

	a, err := audio.ReadMonoWAV(src)
	if err != nil {
		fatal(err)
	}
	onsets := detectOnsets(a, 0.06, 0.16)

	pre := int(srf * 0.004)
	length := int(srf * 0.14)
	fi := int(srf * 0.001)
	fo := int(srf * 0.045)
	lpCoeff := math.Exp(-2 * math.Pi * 3800 / sr)
	peakGlobal := audio.MaxAbs(a)
	if peakGlobal == 0 {
		peakGlobal = 1.0
	}

	kept := 0
	for _, on := range onsets {
		s := on - pre
		if s < 0 {
			s = 0
		}
		end := s + length
		if end > len(a) {
			end = len(a)
		}
		seg := make([]float64, end-s)
		copy(seg, a[s:end])

		if len(seg) < length/2 {
			continue
		}
		if audio.MaxAbs(seg) < 0.06*peakGlobal { // too quiet — probably a tail, skip
			continue
		}

		// Mellow it a touch: gentle low-pass + a softer/longer fade-out.
		audio.OnePoleLP(seg, lpCoeff)
		if len(seg) >= fi+fo {
			in := audio.Linspace(0, 1, fi)
			for j := 0; j < fi; j++ {
				seg[j] *= in[j]
			}
			out := audio.Linspace(1, 0, fo)
			for j := 0; j < fo; j++ {
				seg[len(seg)-fo+j] *= math.Pow(out[j], 1.5)
			}
		}

		norm := audio.MaxAbs(seg)
		if norm == 0 {
			norm = 1.0
		}
		for j := range seg {
			seg[j] = seg[j] / norm * 0.95
		}

		kept++
		name := filepath.Join(outDir, fmt.Sprintf("key%02d.wav", kept))
		if err := audio.WriteMonoWAV16(name, seg); err != nil {
			fatal(err)
		}
	}

	fmt.Printf("  extracted %d keystroke samples from %s -> %s/\n", kept, filepath.Base(src), outDir)
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "extract-keys:", err)
	os.Exit(1)
}
