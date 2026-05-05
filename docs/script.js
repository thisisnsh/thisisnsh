const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const createStoryScroller = () => {
  const story = document.querySelector('.story');
  const shell = document.getElementById('storyShell');
  const heroScene = document.getElementById('heroScene');
  const streamScene = document.getElementById('streamScene');
  const streamWindow = document.getElementById('streamWindow');
  const streamTrack = document.getElementById('streamTrack');
  const primary = document.querySelector('[data-typed="primary"]');
  const secondary = document.querySelector('[data-typed="secondary"]');
  const lyricItems = Array.from(streamTrack.children);

  if (
    !story ||
    !shell ||
    !heroScene ||
    !streamScene ||
    !streamWindow ||
    !streamTrack ||
    !primary ||
    !secondary ||
    lyricItems.length === 0
  ) {
    return;
  }

  const primaryText = primary.textContent.trim();
  const secondaryText = secondary.textContent.trim();
  const totalChars = primaryText.length + secondaryText.length;
  const introHold = totalChars === 0 ? 0 : primaryText.length / totalChars;
  let centerShifts = [];

  let frame = 0;

  const rebuildCenters = () => {
    const maxTrackShift = Math.max(0, streamTrack.scrollHeight - streamWindow.clientHeight);

    centerShifts = lyricItems.map((item) => {
      const centeredOffset =
        item.offsetTop + item.offsetHeight / 2 - streamWindow.clientHeight / 2;

      return clamp(centeredOffset, 0, maxTrackShift);
    });
  };

  const update = () => {
    const storyRect = story.getBoundingClientRect();
    const maxScroll = Math.max(1, story.offsetHeight - window.innerHeight);
    const scrolled = clamp(-storyRect.top, 0, maxScroll);
    const progress = scrolled / maxScroll;

    const typedProgress = clamp(progress / 0.2 + introHold, introHold, 1);
    const visibleChars = Math.round(typedProgress * totalChars);
    const heroChars = Math.min(visibleChars, primaryText.length);
    const subtitleChars = Math.max(0, visibleChars - primaryText.length);

    primary.textContent = primaryText.slice(0, heroChars);
    secondary.textContent = secondaryText.slice(0, subtitleChars);

    const heroOut = clamp((progress - 0.2) / 0.18, 0, 1);
    const streamIn = clamp((progress - 0.22) / 0.14, 0, 1);
    const streamProgress = clamp((progress - 0.3) / 0.58, 0, 1);

    shell.style.setProperty('--hero-shift', `${-heroOut * window.innerHeight * 0.16}px`);
    shell.style.setProperty('--hero-scale', `${1 - heroOut * 0.42}`);
    shell.style.setProperty('--hero-opacity', `${1 - heroOut * 0.72}`);
    shell.style.setProperty('--stream-lift', `${(1 - streamIn) * 40}px`);
    shell.style.setProperty('--stream-opacity', `${streamIn}`);

    const focusIndex = streamProgress * Math.max(lyricItems.length - 1, 1);
    const baseIndex = Math.floor(focusIndex);
    const nextIndex = Math.min(lyricItems.length - 1, baseIndex + 1);
    const localProgress = focusIndex - baseIndex;
    const easedProgress = localProgress * localProgress * (3 - 2 * localProgress);
    const shiftStart = centerShifts[baseIndex] ?? 0;
    const shiftEnd = centerShifts[nextIndex] ?? shiftStart;
    const lyricShift = shiftStart + (shiftEnd - shiftStart) * easedProgress;

    streamTrack.style.transform = `translate3d(0, ${-lyricShift}px, 0)`;

    lyricItems.forEach((item, index) => {
      const focus = clamp(1 - Math.abs(index - focusIndex), 0, 1);
      item.style.setProperty('--focus', `${focus}`);
      item.classList.toggle('is-current', focus > 0.58);
    });

    heroScene.classList.toggle('is-dim', heroOut > 0.72);
    streamScene.classList.toggle('is-live', streamIn > 0.08);
  };

  const queueUpdate = () => {
    if (frame) {
      return;
    }

    frame = window.requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };

  rebuildCenters();
  update();
  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', () => {
    rebuildCenters();
    queueUpdate();
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      rebuildCenters();
      queueUpdate();
    });
  }
};

createStoryScroller();
