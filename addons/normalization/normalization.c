/*
 * Copyright (c) 2011 Jan Kokemüller
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 **/

#include <math.h>
#include <queue.h>
#include <sndfile.h>
#include <stdlib.h>
#include <string.h>

#include "ebur128.h"

STAILQ_HEAD(ebur128_double_queue, ebur128_dq_entry);
struct ebur128_dq_entry {
  double z;
  STAILQ_ENTRY(ebur128_dq_entry) entries;
};

static double relative_gate_factor = 0.1;
static double target_loudness = -18;

#define FILTER_STATE_SIZE 5

typedef struct {
  unsigned int count;  /* Number of coefficients in this subfilter */
  unsigned int* index; /* Delay index of corresponding filter coeff */
  double* coeff;       /* List of subfilter coefficients */
} interp_filter;

typedef struct {         /* Data structure for polyphase FIR interpolator */
  unsigned int factor;   /* Interpolation factor of the interpolator */
  unsigned int taps;     /* Taps (prefer odd to increase zero coeffs) */
  unsigned int channels; /* Number of channels */
  unsigned int delay;    /* Size of delay buffer */
  interp_filter* filter; /* List of subfilters (one for each factor) */
  float** z;             /* List of delay buffers (one for each channel) */
  unsigned int zi;       /* Current delay buffer index */
} interpolator;

/** BS.1770 filter state. */
typedef double filter_state[FILTER_STATE_SIZE];

struct ebur128_state_internal {
  /** Filtered audio data (used as ring buffer). */
  double* audio_data;
  /** Size of audio_data array. */
  size_t audio_data_frames;
  /** Current index for audio_data. */
  size_t audio_data_index;
  /** How many frames are needed for a gating block. Will correspond to 400ms
   *  of audio at initialization, and 100ms after the first block (75% overlap
   *  as specified in the 2011 revision of BS1770). */
  unsigned long needed_frames;
  /** The channel map. Has as many elements as there are channels. */
  int* channel_map;
  /** How many samples fit in 100ms (rounded). */
  unsigned long samples_in_100ms;
  /** BS.1770 filter coefficients (nominator). */
  double b[5];
  /** BS.1770 filter coefficients (denominator). */
  double a[5];
  /** one filter_state per channel. */
  filter_state* v;
  /** Linked list of block energies. */
  struct ebur128_double_queue block_list;
  unsigned long block_list_max;
  unsigned long block_list_size;
  /** Linked list of 3s-block energies, used to calculate LRA. */
  struct ebur128_double_queue short_term_block_list;
  unsigned long st_block_list_max;
  unsigned long st_block_list_size;
  int use_histogram;
  unsigned long* block_energy_histogram;
  unsigned long* short_term_block_energy_histogram;
  /** Keeps track of when a new short term block is needed. */
  size_t short_term_frame_counter;
  /** Maximum sample peak, one per channel */
  double* sample_peak;
  double* prev_sample_peak;
  /** Maximum true peak, one per channel */
  double* true_peak;
  double* prev_true_peak;
  interpolator* interp;
  float* resampler_buffer_input;
  size_t resampler_buffer_input_frames;
  float* resampler_buffer_output;
  size_t resampler_buffer_output_frames;
  /** The maximum window duration in ms. */
  unsigned long window;
  unsigned long history;
};

static double convert_energy_to_loudness(double energy) {
  return 10 * (log(energy) / log(10.0)) - 0.691;
}

double max_element(double* array, size_t size) {
  if (size == 0) {
    return 0;
  }

  double max_elem = array[0];
  for (size_t i = 1; i < size; ++i) {
    if (array[i] > max_elem) {
      max_elem = array[i];
    }
  }

  return max_elem;
}

struct calc_loudness_error {
  uint64_t code;
  const char* message;
};

static struct calc_loudness_error no_error = { .code = 0, .message = "" };
static struct calc_loudness_error state_malloc_failed = {
  .code = 1, .message = "Failed malloc for state"
};
static struct calc_loudness_error open_input_file_failed = {
  .code = 2, .message = "Failed to open input file"
};
static struct calc_loudness_error ebur128_state_create_failed = {
  .code = 3, .message = "Failed to create ebur128 state"
};
static struct calc_loudness_error state_buffer_malloc_failed = {
  .code = 4, .message = "Failed malloc for state buffer"
};
static struct calc_loudness_error average_treshold_calculation_failed = {
  .code = 5, .message = "Failed to calculate average treshold"
};
static struct calc_loudness_error gated_loudness_calculation_failed = {
  .code = 5, .message = "Failed to calculate gated loudness"
};
static struct calc_loudness_error block_list_malloc_failed = {
  .code = 6, .message = "Failed malloc for block_list"
};

struct calc_loudness_result {
  struct calc_loudness_error error;
  const char* filepath;
  double target_level_db;
  double gain_db;
  double sample_peak;
  double sample_peak_db;
  double dynamic_range_db;
  double* block_list;
  uint64_t block_list_size;
};

struct calc_loudness_result calc_loudness(const char* filepath,
                                          const wchar_t* maybe_wfilepath) {
  SF_INFO file_info;
  SNDFILE* file;
  sf_count_t nr_frames_read;
  ebur128_state** state = NULL;

  // Set initial values for result
  struct calc_loudness_result result;
  result.filepath = filepath;
  result.error = no_error;
  result.target_level_db = target_loudness;
  result.gain_db = 0;
  result.sample_peak = 0;
  result.sample_peak_db = 0;
  result.dynamic_range_db = 0;
  result.block_list_size = 0;

  // Allocate memory and initialize
  state = (ebur128_state**) malloc(sizeof(ebur128_state*));
  if (!state) {
    result.error = state_malloc_failed;
    fprintf(stderr, "%s%s", result.error.message, "\n");
    return result;
  }

  memset(&file_info, '\0', sizeof(file_info));
#ifdef _WIN32
  file = sf_wchar_open(maybe_wfilepath, SFM_READ, &file_info);
#else
  file = sf_open(filepath, SFM_READ, &file_info);
#endif
  if (!file) {
    result.error = open_input_file_failed;
    fprintf(stderr, "%s %s%s", result.error.message, filepath, "\n");
    return result;
  }

  state[0] = ebur128_init((unsigned) file_info.channels,
                          (unsigned) file_info.samplerate,
                          EBUR128_MODE_I | EBUR128_MODE_SAMPLE_PEAK);

  if (!state[0]) {
    result.error = ebur128_state_create_failed;
    fprintf(stderr, "%s%s", result.error.message, "\n");
    return result;
  }
  double* buffer = (double*) malloc(state[0]->samplerate * state[0]->channels *
                                    sizeof(double));
  if (!buffer) {
    result.error = state_buffer_malloc_failed;
    fprintf(stderr, "%s%s", result.error.message, "\n");
    return result;
  }

  // Input the audio file frames
  while ((nr_frames_read = sf_readf_double(
              file, buffer, (sf_count_t) state[0]->samplerate))) {
    ebur128_add_frames_double(state[0], buffer, (size_t) nr_frames_read);
  }

  // Calculate average treshold
  struct ebur128_dq_entry* entry;
  double relative_threshold = 0.0;
  int64_t above_thresh_counter = 0;
  STAILQ_FOREACH(entry, &state[0]->d->block_list, entries) {
    ++above_thresh_counter;
    relative_threshold += entry->z;
  }
  if (!above_thresh_counter) {
    result.error = average_treshold_calculation_failed;
    fprintf(stderr, "%s%s", result.error.message, "\n");
    return result;
  }
  relative_threshold /= (double) above_thresh_counter;
  relative_threshold *= relative_gate_factor;

  // Calculate gated loudness
  double gated_loudness = 0.0;
  int64_t gated_loudness_above_thresh_counter = 0;
  STAILQ_FOREACH(entry, &state[0]->d->block_list, entries) {
    if (entry->z >= relative_threshold) {
      ++gated_loudness_above_thresh_counter;
      gated_loudness += entry->z;
    }
  }
  if (!gated_loudness_above_thresh_counter) {
    result.error = gated_loudness_calculation_failed;
    fprintf(stderr, "%s%s", result.error.message, "\n");
    return result;
  }
  gated_loudness /= (double) gated_loudness_above_thresh_counter;
  double loudness = convert_energy_to_loudness(gated_loudness);

  // Calculate sample peak
  int num_channels = state[0]->channels;
  double* peaks = (double*) malloc(num_channels * sizeof(double));
  for (uint64_t j = 0; j < sizeof(num_channels); j++) {
    ebur128_sample_peak(state[0], j, &peaks[j]);
  }

  // Set result
  result.gain_db = target_loudness - loudness;
  result.sample_peak = max_element(peaks, num_channels);
  result.sample_peak_db = 10.0 * log10(result.sample_peak);
  result.dynamic_range_db =
      loudness - (result.sample_peak >= 1 ? 0.0 : result.sample_peak_db);

  // The block list is needed for calculating album loudness
  STAILQ_FOREACH(entry, &state[0]->d->block_list, entries) {
    result.block_list_size++;
  }
  result.block_list = (double*) malloc(result.block_list_size * sizeof(double));
  if (!result.block_list) {
    result.error = block_list_malloc_failed;
    fprintf(stderr, "%s%s", result.error.message, "\n");
    return result;
  }
  int64_t index = 0;
  STAILQ_FOREACH(entry, &state[0]->d->block_list, entries) {
    result.block_list[index++] = entry->z;
  }

  // Free memory
  free(peaks);
  free(buffer);
  buffer = NULL;
  if (sf_close(file)) {
    fprintf(stderr, "Could not close input file\n");
  }
  ebur128_destroy(&state[0]);
  free(state);

  return result;
}

double calc_loudness_album(double* block_list, int64_t block_list_size) {
  // Get the average relative threshold of all block energies
  double relative_threshold = 0.0;
  int64_t above_thresh_counter = 0;
  for (int64_t i = 0; i < block_list_size; ++i) {
    ++above_thresh_counter;
    relative_threshold += block_list[i];
  }
  relative_threshold /= (double) above_thresh_counter;
  relative_threshold *= relative_gate_factor;

  // Get the average gated loudness that surpasses the average relative treshold
  double gated_loudness = 0.0;
  int64_t gated_loudness_above_thresh_counter = 0;
  for (int64_t i = 0; i < block_list_size; ++i) {
    if (block_list[i] >= relative_threshold) {
      ++gated_loudness_above_thresh_counter;
      gated_loudness += block_list[i];
    }
  }
  gated_loudness /= (double) gated_loudness_above_thresh_counter;

  return target_loudness - convert_energy_to_loudness(gated_loudness);
}
