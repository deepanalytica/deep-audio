# MVP Test Plan

## Reference setup

- Windows 11.
- Fluid Audio SRI-2 with current vendor driver.
- Electric bass.
- Headphones connected to the interface.
- 48 kHz session rate.
- 24-bit recording.

## Gate A — Device

For ASIO and, secondarily, WASAPI:

1. Launch app.
2. Open Audio.
3. Select SRI-2.
4. Select input 1 and stereo output.
5. Confirm device summary updates.
6. Close/reopen app during the persistence milestone and verify restoration.

Pass:
- device opens without crash;
- input meter responds;
- no unexpected feedback path.

## Gate B — Buffer matrix

Run at:

- 64 samples;
- 128 samples;
- 256 samples;
- 512 samples.

For each:

- monitor bass for five minutes;
- play backing track;
- enable metronome;
- record for five minutes.

Capture:

- audible clicks/dropouts;
- CPU anomalies;
- perceived latency;
- file integrity.

MVP target:
- 128 samples must be stable on the reference machine.
- 64 is desirable but not a release blocker if hardware/driver limits it.
- 256 and 512 must be stable.

## Gate C — Sample rates

Test:

- 44.1 kHz;
- 48 kHz;
- 96 kHz if exposed by the driver.

Pass:
- correct playback speed;
- valid WAV metadata;
- no pitch change caused by rate mismatch.

48 kHz is the default product recommendation for v0.1.

## Gate D — Recording integrity

Record continuously for:

- 5 minutes;
- 30 minutes;
- 60 minutes.

After each:

- reopen WAV in an independent player/editor;
- verify duration;
- inspect for truncation;
- inspect first/last ten seconds;
- verify no corrupted header.

Release gate:
- zero corrupt files in the matrix.

## Gate E — Core journey

Fresh user target journey:

1. Open.
2. Choose SRI-2 once.
3. Connect bass.
4. Hear bass.
5. Select Studio Bass.
6. Import song.
7. Play.
8. Enable click.
9. Record.
10. Stop.
11. Locate the saved take.

Measure:
- Time to Sound.
- Time to Record.
- number of user decisions before first sound.

## Gate F — Audio-thread discipline

Profile a normal session and verify:

- no filesystem calls from callback;
- no network calls;
- no UI work;
- no repeated dynamic resizing;
- recorder disk work runs on its TimeSliceThread.

## Gate G — Failure behaviour

Test:

- interface unplugged while idle;
- interface unplugged while playing;
- interface unplugged while recording;
- unsupported/corrupt backing file;
- disk full simulation;
- permission failure in Music folder.

Expected:
- no silent data-loss claim;
- clear error;
- app remains recoverable where possible.

## Release evidence

Every release candidate should store a small test report containing:

- app commit SHA;
- Windows version;
- driver version;
- interface firmware if available;
- sample rate;
- buffer size;
- pass/fail by gate;
- known limitations.
