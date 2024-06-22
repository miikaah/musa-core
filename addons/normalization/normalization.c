/* See COPYING file for copyright and license details. */

#include <sndfile.h>
#include <stdlib.h>
#include <string.h>

#include "ebur128.h"

double calc_loudness(int ac, const char* av[]) {
  SF_INFO file_info;
  SNDFILE* file;
  sf_count_t nr_frames_read;
  ebur128_state** sts = NULL;
  double* buffer;
  double loudness;
  double target_loudness = -18;

  if (ac < 2) {
    fprintf(stderr, "usage: %s FILENAME...\n", av[0]);
    exit(1);
  }

  sts = (ebur128_state**) malloc((size_t) (ac - 1) * sizeof(ebur128_state*));
  if (!sts) {
    fprintf(stderr, "malloc failed\n");
    return 1;
  }

  memset(&file_info, '\0', sizeof(file_info));
  file = sf_open(av[1], SFM_READ, &file_info);
  if (!file) {
    fprintf(stderr, "Could not open file with sf_open!\n");
    return 1;
  }

  sts[0] = ebur128_init((unsigned) file_info.channels,
                        (unsigned) file_info.samplerate, EBUR128_MODE_I);
  if (!sts[0]) {
    fprintf(stderr, "Could not create ebur128_state!\n");
    return 1;
  }

  /* example: set channel map (note: see ebur128.h for the default map) */
  if (file_info.channels == 5) {
    ebur128_set_channel(sts[0], 0, EBUR128_LEFT);
    ebur128_set_channel(sts[0], 1, EBUR128_RIGHT);
    ebur128_set_channel(sts[0], 2, EBUR128_CENTER);
    ebur128_set_channel(sts[0], 3, EBUR128_LEFT_SURROUND);
    ebur128_set_channel(sts[0], 4, EBUR128_RIGHT_SURROUND);
  }

  buffer =
      (double*) malloc(sts[0]->samplerate * sts[0]->channels * sizeof(double));
  if (!buffer) {
    fprintf(stderr, "malloc failed\n");
    return 1;
  }

  while ((nr_frames_read =
              sf_readf_double(file, buffer, (sf_count_t) sts[0]->samplerate))) {
    ebur128_add_frames_double(sts[0], buffer, (size_t) nr_frames_read);
  }

  ebur128_loudness_global(sts[0], &loudness);
  fprintf(stdout, "%.2f LUFS, %s\n", target_loudness - loudness, av[1]);

  free(buffer);
  buffer = NULL;

  if (sf_close(file)) {
    fprintf(stderr, "Could not close input file!\n");
  }

  ebur128_destroy(&sts[0]);
  free(sts);

  return target_loudness - loudness;
}
