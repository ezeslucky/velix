package audio

import (
	"encoding/binary"
	"fmt"
	"math"
	"os"
)

// ReadMonoWAV reads a PCM WAV file and returns its samples as a mono float64
// signal normalized to [-1, 1] at SampleRate. Multi-channel files are downmixed
// by averaging; rates other than SampleRate are linearly resampled. Supports
// 8-bit (unsigned), 16-bit, and 32-bit integer PCM.
func ReadMonoWAV(path string) ([]float64, error) {
	buf, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	if len(buf) < 12 || string(buf[0:4]) != "RIFF" || string(buf[8:12]) != "WAVE" {
		return nil, fmt.Errorf("%s: not a RIFF/WAVE file", path)
	}

	var (
		channels   int
		sampleRate int
		bits       int
		data       []byte
		haveFmt    bool
	)

	// Walk the chunk list: 4-byte id, 4-byte little-endian size, then payload
	// (padded to an even length).
	pos := 12
	for pos+8 <= len(buf) {
		id := string(buf[pos : pos+4])
		size := int(binary.LittleEndian.Uint32(buf[pos+4 : pos+8]))
		body := pos + 8
		if body+size > len(buf) {
			size = len(buf) - body // tolerate a truncated final chunk
		}
		switch id {
		case "fmt ":
			if size < 16 {
				return nil, fmt.Errorf("%s: short fmt chunk", path)
			}
			channels = int(binary.LittleEndian.Uint16(buf[body+2 : body+4]))
			sampleRate = int(binary.LittleEndian.Uint32(buf[body+4 : body+8]))
			bits = int(binary.LittleEndian.Uint16(buf[body+14 : body+16]))
			haveFmt = true
		case "data":
			data = buf[body : body+size]
		}
		pos = body + size + (size & 1)
	}

	if !haveFmt || data == nil {
		return nil, fmt.Errorf("%s: missing fmt or data chunk", path)
	}
	if channels < 1 {
		channels = 1
	}

	samples, err := decodePCM(data, bits)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", path, err)
	}

	mono := downmix(samples, channels)
	if sampleRate != SampleRate && len(mono) > 1 {
		mono = resample(mono, sampleRate, SampleRate)
	}
	return mono, nil
}

// decodePCM converts interleaved integer PCM bytes to float64 in [-1, 1].
func decodePCM(data []byte, bits int) ([]float64, error) {
	switch bits {
	case 8:
		out := make([]float64, len(data))
		for i, b := range data {
			out[i] = (float64(b) - 128) / 128.0 // 8-bit WAV is unsigned
		}
		return out, nil
	case 16:
		n := len(data) / 2
		out := make([]float64, n)
		for i := 0; i < n; i++ {
			s := int16(binary.LittleEndian.Uint16(data[i*2 : i*2+2]))
			out[i] = float64(s) / math.MaxInt16
		}
		return out, nil
	case 32:
		n := len(data) / 4
		out := make([]float64, n)
		for i := 0; i < n; i++ {
			s := int32(binary.LittleEndian.Uint32(data[i*4 : i*4+4]))
			out[i] = float64(s) / math.MaxInt32
		}
		return out, nil
	default:
		return nil, fmt.Errorf("unsupported bit depth %d", bits)
	}
}

// downmix averages interleaved channels down to mono.
func downmix(samples []float64, channels int) []float64 {
	if channels <= 1 {
		return samples
	}
	frames := len(samples) / channels
	out := make([]float64, frames)
	for f := 0; f < frames; f++ {
		sum := 0.0
		for c := 0; c < channels; c++ {
			sum += samples[f*channels+c]
		}
		out[f] = sum / float64(channels)
	}
	return out
}

// resample linearly resamples a from rate from to rate to, matching the cheap
// np.interp(linspace(...)) resampling the Python used.
func resample(a []float64, from, to int) []float64 {
	n := int(float64(len(a)) * float64(to) / float64(from))
	if n <= 0 {
		return nil
	}
	idx := Linspace(0, float64(len(a)-1), n)
	xp := make([]float64, len(a))
	for i := range xp {
		xp[i] = float64(i)
	}
	return Interp(idx, xp, a)
}

// WriteMonoWAV16 writes samples as a mono, 16-bit PCM WAV at SampleRate. Values
// are clamped to [-1, 1] before scaling.
func WriteMonoWAV16(path string, samples []float64) error {
	dataLen := len(samples) * 2
	buf := make([]byte, 44+dataLen)

	copy(buf[0:4], "RIFF")
	binary.LittleEndian.PutUint32(buf[4:8], uint32(36+dataLen))
	copy(buf[8:12], "WAVE")

	copy(buf[12:16], "fmt ")
	binary.LittleEndian.PutUint32(buf[16:20], 16)           // PCM fmt chunk size
	binary.LittleEndian.PutUint16(buf[20:22], 1)            // audio format = PCM
	binary.LittleEndian.PutUint16(buf[22:24], 1)            // channels
	binary.LittleEndian.PutUint32(buf[24:28], SampleRate)   // sample rate
	binary.LittleEndian.PutUint32(buf[28:32], SampleRate*2) // byte rate
	binary.LittleEndian.PutUint16(buf[32:34], 2)            // block align
	binary.LittleEndian.PutUint16(buf[34:36], 16)           // bits per sample
	copy(buf[36:40], "data")
	binary.LittleEndian.PutUint32(buf[40:44], uint32(dataLen))

	for i, v := range samples {
		if v > 1 {
			v = 1
		} else if v < -1 {
			v = -1
		}
		s := int16(v * 32767)
		binary.LittleEndian.PutUint16(buf[44+i*2:46+i*2], uint16(s))
	}

	return os.WriteFile(path, buf, 0o644)
}
