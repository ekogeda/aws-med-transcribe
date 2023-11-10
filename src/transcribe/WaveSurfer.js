import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import MicrophonePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.microphone.min.js';

const AudioWaveform = () => {
  const waveformRef = useRef(null);

  useEffect(() => {
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'black',
      interact: false,
      cursorWidth: 0,
      plugins: [
        MicrophonePlugin.create()
      ]
    });

    wavesurfer.microphone.on('deviceReady', function (stream) {
      console.log('Device ready!', stream);
    });

    wavesurfer.microphone.on('deviceError', function (code) {
      console.warn('Device error: ' + code);
    });

    // Start the microphone
    wavesurfer.microphone.start();

    // Clean up on component unmount
    return () => {
      wavesurfer.microphone.stop();
      wavesurfer.destroy();
    };
  }, []); // Empty dependency array ensures this effect runs once after the initial render

  return (
    <div id="waveform" ref={waveformRef}></div>
  );
};

export default AudioWaveform;
