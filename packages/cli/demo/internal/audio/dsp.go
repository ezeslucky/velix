// Package audio holds the small WAV I/O and DSP helpers shared by the demo
// sound tools. It reimplements the handful of numpy operations the original
// Python scripts relied on (moving-average convolution, linspace, linear
// interpolation, argmax, one-pole low-pass) using only the standard library.
package audio

import "math"

// SampleRate is the working rate for every buffer in the demo pipeline.
const SampleRate = 44100

// Linspace returns n evenly spaced values from start to stop inclusive,
// matching numpy.linspace(start, stop, n). n <= 0 yields nil; n == 1 yields
// [start].
func Linspace(start, stop float64, n int) []float64 {
	if n <= 0 {
		return nil
	}
	if n == 1 {
		return []float64{start}
	}
	out := make([]float64, n)
	step := (stop - start) / float64(n-1)
	for i := range out {
		out[i] = start + step*float64(i)
	}
	return out
}

// Interp linearly interpolates each x against the points (xp, fp), matching
// numpy.interp. xp must be increasing. Values of x outside xp clamp to the
// endpoint fp values.
func Interp(x, xp, fp []float64) []float64 {
	out := make([]float64, len(x))
	if len(xp) == 0 {
		return out
	}
	j := 0
	for i, xv := range x {
		if xv <= xp[0] {
			out[i] = fp[0]
			continue
		}
		if xv >= xp[len(xp)-1] {
			out[i] = fp[len(fp)-1]
			continue
		}
		// Advance the search cursor; x is typically monotonic so this is O(n).
		for j < len(xp)-1 && xp[j+1] < xv {
			j++
		}
		x0, x1 := xp[j], xp[j+1]
		f0, f1 := fp[j], fp[j+1]
		if x1 == x0 {
			out[i] = f0
			continue
		}
		out[i] = f0 + (f1-f0)*(xv-x0)/(x1-x0)
	}
	return out
}

// MovingAvg returns the centered moving average of a with window win, the same
// length as a. It is equivalent to numpy.convolve(a, ones(win)/win, "same")
// for a nonnegative signal (the callers pass |a|).
func MovingAvg(a []float64, win int) []float64 {
	out := make([]float64, len(a))
	if win <= 1 || len(a) == 0 {
		copy(out, a)
		return out
	}
	// Prefix sums for an O(n) sliding window.
	prefix := make([]float64, len(a)+1)
	for i, v := range a {
		prefix[i+1] = prefix[i] + v
	}
	// "same" centers a length-win kernel: numpy's convolve places the output at
	// offset win/2, so sample i averages the window [i-win/2, i-win/2+win).
	half := win / 2
	for i := range a {
		lo := i - half
		hi := lo + win
		if lo < 0 {
			lo = 0
		}
		if hi > len(a) {
			hi = len(a)
		}
		// Divide by the full window width (not the clamped count) to match
		// convolve's zero-padding at the edges.
		out[i] = (prefix[hi] - prefix[lo]) / float64(win)
	}
	return out
}

// OnePoleLP applies an in-place one-pole low-pass: prev = (1-coeff)*x + coeff*prev.
func OnePoleLP(seg []float64, coeff float64) {
	prev := 0.0
	for i, v := range seg {
		prev = (1-coeff)*v + coeff*prev
		seg[i] = prev
	}
}

// MaxAbs returns the largest absolute value in a, or 0 for an empty slice.
func MaxAbs(a []float64) float64 {
	m := 0.0
	for _, v := range a {
		if av := math.Abs(v); av > m {
			m = av
		}
	}
	return m
}

// FirstTrue returns the index of the first element for which pred is true, or 0
// if none match — mirroring numpy.argmax over a boolean array.
func FirstTrue(n int, pred func(i int) bool) int {
	for i := 0; i < n; i++ {
		if pred(i) {
			return i
		}
	}
	return 0
}
