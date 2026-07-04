// Command gen-audio generates a keyboard-click track for the VHS demo, timed off
// the .tape script. Clicks are placed by replaying the .tape timeline: every
// `Type` character costs `TypingSpeed`, every `Enter` is a keystroke, every
// `Sleep` advances the clock, and the `Hide`..`Show` block is skipped (VHS
// doesn't render it).
//
// The click sound is synthesized by default. Pass a WAV (a single keystroke) or
// a directory of WAVs (a pool of keystrokes — picked at random per key) to use
// real recordings instead; each hit gets slight pitch/level jitter.
//
// Usage:  gen-audio <tape> <out.wav> <duration_seconds> [keys.wav|keys_dir] [keyreturn.wav]
//
// Ported from the original gen_audio.py. NOTE: the random synth/jitter uses Go's
// RNG, so output is deterministic per run but not byte-identical to the Python.
package main

import (
	"bufio"
	"fmt"
	"math"
	"math/rand/v2"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"velix/demo/internal/audio"
)

const sr = audio.SampleRate

// srf is the same rate as a runtime float64 so int(srf*fraction) truncates like
// Python's int() (a constant int(sr*0.006) would be rejected at compile time).
var srf = float64(sr)

// Fixed seed keeps runs reproducible (mirrors numpy's default_rng(7)); the exact
// sample values differ from the Python since the PRNG streams differ.
var rng = rand.New(rand.NewPCG(7, 0))

func uniform(lo, hi float64) float64 { return lo + (hi-lo)*rng.Float64() }

var (
	reTypingSpeed = regexp.MustCompile(`^Set\s+TypingSpeed\s+([\d.]+)(ms|s)?`)
	reSleep       = regexp.MustCompile(`^Sleep\s+([\d.]+)(ms|s)?`)
	reSpecialKey  = regexp.MustCompile(`^(Ctrl\+|Alt\+|Shift\+|Backspace|Tab|Space|Escape|Up|Down|Left|Right|PageUp|PageDown)`)
)

// ---------------------------------------------------------------- tape timeline

// parseEvents replays a .tape file and returns the timeline offsets (seconds) of
// every keystroke and every Enter.
func parseEvents(tapePath string) (keys, returns []float64, err error) {
	f, err := os.Open(tapePath)
	if err != nil {
		return nil, nil, err
	}
	defer f.Close()

	typingSpeed := 0.05 // VHS default; tape overrides via `Set TypingSpeed`
	t := 0.0
	inHidden := false

	scan := bufio.NewScanner(f)
	for scan.Scan() {
		line := strings.TrimSpace(scan.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		head := strings.Fields(line)[0]

		switch head {
		case "Hide":
			inHidden = true
			continue
		case "Show":
			inHidden = false
			t = 0.0
			continue
		}

		if m := reTypingSpeed.FindStringSubmatch(line); m != nil {
			v, _ := strconv.ParseFloat(m[1], 64)
			if m[2] == "ms" {
				v /= 1000
			}
			typingSpeed = v
			continue
		}
		switch head {
		case "Set", "Output", "Require", "Env":
			continue
		}

		if m := reSleep.FindStringSubmatch(line); m != nil {
			v, _ := strconv.ParseFloat(m[1], 64)
			unit := m[2]
			if unit == "" {
				unit = "s"
			}
			if unit == "ms" {
				v /= 1000
			}
			if !inHidden {
				t += v
			}
			continue
		}

		if head == "Type" {
			body := strings.TrimSpace(strings.TrimPrefix(line, "Type"))
			if len(body) >= 2 && isQuote(body[0]) && body[len(body)-1] == body[0] {
				body = body[1 : len(body)-1]
			}
			for range body { // one key per rune, matching Python char iteration
				if !inHidden {
					keys = append(keys, t)
				}
				t += typingSpeed
			}
			continue
		}

		if head == "Enter" {
			if !inHidden {
				returns = append(returns, t)
			}
			t += typingSpeed
			continue
		}

		if reSpecialKey.MatchString(head) {
			if !inHidden {
				keys = append(keys, t)
			}
			t += typingSpeed
			continue
		}
	}
	return keys, returns, scan.Err()
}

func isQuote(b byte) bool { return b == '"' || b == '\'' || b == '`' }

// --------------------------------------------------------------------- samples

// loadWavMono reads a WAV as mono at SampleRate, then trims leading silence so
// the transient lands on the timestamp.
func loadWavMono(path string) ([]float64, error) {
	a, err := audio.ReadMonoWAV(path)
	if err != nil {
		return nil, err
	}
	peak := audio.MaxAbs(a)
	if peak == 0 {
		peak = 1.0
	}
	thr := 0.02 * peak
	nz := audio.FirstTrue(len(a), func(i int) bool { return math.Abs(a[i]) > thr })
	return a[nz:], nil
}

// jitter applies a small random pitch shift and level change to a sample.
func jitter(sample []float64) []float64 {
	const semitones, gainDB = 1.5, 2.5
	sp := math.Pow(2, uniform(-semitones, semitones)/12)

	xp := make([]float64, len(sample))
	for i := range xp {
		xp[i] = float64(i)
	}
	var idx []float64
	for x := 0.0; x < float64(len(sample)); x += sp {
		idx = append(idx, x)
	}
	s := audio.Interp(idx, xp, sample)

	gain := math.Pow(10, uniform(-gainDB, gainDB)/20)
	for i := range s {
		s[i] *= gain
	}
	return s
}

// ---------------------------------------------------------- synthesized clicks

func synthClick(kind string) []float64 {
	var bodyF, dur, amp, clickAmp, noiseAmp float64
	if kind == "return" {
		bodyF, dur, amp = uniform(95, 120), 0.075, 0.95
		clickAmp, noiseAmp = 0.5, 0.35
	} else {
		bodyF, dur, amp = uniform(150, 235), 0.045, uniform(0.6, 0.85)
		clickAmp, noiseAmp = 0.45, 0.30
	}
	n := int(sr * dur)
	sig := make([]float64, n)

	nlen := int(srf * 0.006)
	tickFreq := uniform(2600, 3400)
	for i := 0; i < n; i++ {
		tt := float64(i) / sr
		var noise float64
		if i < nlen {
			noise = rng.NormFloat64() * math.Exp(-float64(i)/(float64(nlen)*0.4)) * noiseAmp
		}
		tick := math.Sin(2*math.Pi*tickFreq*tt) * math.Exp(-tt/0.004) * clickAmp
		body := math.Sin(2*math.Pi*bodyF*tt) * math.Exp(-tt/(dur*0.5))
		sig[i] = (noise + tick + body) * amp
	}

	a := int(srf * 0.0008)
	ramp := audio.Linspace(0, 1, a)
	for i := 0; i < a && i < n; i++ {
		sig[i] *= ramp[i]
	}
	return sig
}

// loadPool returns the sample arrays for a path: a single WAV, or every *.wav in
// a directory. An empty or missing path yields no samples (synth fallback).
func loadPool(path string) ([]([]float64), error) {
	if path == "" {
		return nil, nil
	}
	info, err := os.Stat(path)
	if err != nil {
		return nil, nil // missing path — fall back to synth, like the Python
	}
	if info.IsDir() {
		entries, err := os.ReadDir(path)
		if err != nil {
			return nil, err
		}
		var names []string
		for _, e := range entries {
			if strings.HasSuffix(strings.ToLower(e.Name()), ".wav") {
				names = append(names, e.Name())
			}
		}
		sort.Strings(names)
		var pool [][]float64
		for _, name := range names {
			s, err := loadWavMono(filepath.Join(path, name))
			if err != nil {
				return nil, err
			}
			pool = append(pool, s)
		}
		return pool, nil
	}
	s, err := loadWavMono(path)
	if err != nil {
		return nil, err
	}
	return [][]float64{s}, nil
}

// clickMinGap keeps fast on-screen typing from sounding like a machine gun — the
// audio "types" calmer than the video.
const clickMinGap = 0.09

func thin(times []float64, minGap float64) []float64 {
	var out []float64
	last := -1e9
	for _, t := range times {
		if t-last >= minGap {
			out = append(out, t)
			last = t
		}
	}
	return out
}

func buildTrack(keys, returns []float64, totalLen float64, keyPool, retPool [][]float64) []float64 {
	buf := make([]float64, int(sr*totalLen)+sr)

	place := func(times []float64, pool [][]float64, kind string, gain float64) {
		for _, t := range times {
			var c []float64
			if len(pool) > 0 {
				c = jitter(pool[rng.IntN(len(pool))])
				for i := range c {
					c[i] *= gain
				}
			} else {
				c = synthClick(kind)
			}
			i := int(t * sr)
			for j, v := range c {
				if i+j < len(buf) {
					buf[i+j] += v
				}
			}
		}
	}

	place(thin(keys, clickMinGap), keyPool, "key", 1.0)
	// Enter: prefer a dedicated return sample; else reuse the keypress pool a
	// touch louder.
	retSamples := retPool
	retGain := 1.0
	if len(retPool) == 0 {
		retSamples = keyPool
		retGain = 1.15
	}
	place(returns, retSamples, "return", retGain)

	end := int(sr * totalLen)
	if end > len(buf) {
		end = len(buf)
	}
	return buf[:end]
}

func main() {
	if len(os.Args) < 4 {
		fmt.Fprintln(os.Stderr, "usage: gen-audio <tape> <out.wav> <duration_seconds> [keys.wav|keys_dir] [keyreturn.wav]")
		os.Exit(2)
	}
	tape, outWav := os.Args[1], os.Args[2]
	dur, err := strconv.ParseFloat(os.Args[3], 64)
	if err != nil {
		fatal(fmt.Errorf("invalid duration %q: %w", os.Args[3], err))
	}
	keyPath, retPath := "", ""
	if len(os.Args) > 4 {
		keyPath = os.Args[4]
	}
	if len(os.Args) > 5 {
		retPath = os.Args[5]
	}

	keyPool, err := loadPool(keyPath)
	if err != nil {
		fatal(err)
	}
	retPool, err := loadPool(retPath)
	if err != nil {
		fatal(err)
	}
	src := "synth"
	if len(keyPool) > 0 {
		src = fmt.Sprintf("sample pool x%d", len(keyPool))
	}

	keys, returns, err := parseEvents(tape)
	if err != nil {
		fatal(err)
	}
	fmt.Printf("  %d keystrokes + %d returns over %.1fs (%s clicks)\n", len(keys), len(returns), dur, src)

	track := buildTrack(keys, returns, dur, keyPool, retPool)
	peak := audio.MaxAbs(track)
	if peak == 0 {
		peak = 1.0
	}
	for i := range track {
		track[i] = track[i] / peak * 0.9 // leave headroom for the music mix downstream
	}

	if err := audio.WriteMonoWAV16(outWav, track); err != nil {
		fatal(err)
	}
	fmt.Printf("  wrote %s\n", outWav)
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "gen-audio:", err)
	os.Exit(1)
}
