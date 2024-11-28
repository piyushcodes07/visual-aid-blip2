'use client';

import React, { useState, useRef, useEffect } from 'react';

function CameraCapture() {
  const videoRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    startVideo();
  }, []);
  const [loading,setLoading] = useState(false)
  const captureImage = async () => {
    setLoading(true)
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageDataUrl);

    // Convert the data URL to a Blob
    const blob = dataURLtoBlob(imageDataUrl);

    // Send the blob to the API
    try {
      const response = await query(blob);
      const generatedCaption = response[0]?.generated_text || 'No caption generated.';
      setCaption(generatedCaption);
      setLoading(false)
      speakCaption(caption)

      // Trigger Text-to-Speech for the caption
      speakCaption(generatedCaption);
    } catch (error) {
      console.error('Error querying the API:', error);
    }
  };

  const dataURLtoBlob = (dataURL) => {
    const parts = dataURL.split(';base64,');
    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(':')[1];
    const arrayBuffer = new Uint8Array(byteString.length);

    for (let i = 0; i < byteString.length; i++) {
      arrayBuffer[i] = byteString.charCodeAt(i);
    }

    return new Blob([arrayBuffer], { type: mimeString });
  };

  const query = async (blob) => {
    console.log(process.env.NEXT_PUBLIC_key);
    
    const response = await fetch(
      'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large',
      {
        headers: {
          Authorization: process.env.NEXT_PUBLIC_key,
          'Content-Type': 'application/octet-stream',
        },
        method: 'POST',
        body: blob,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from the API');
    }

    return response.json();
  };

  const speakCaption = (text) => {
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);

    utterance.lang = 'en-US'; // Adjust language if needed
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return (
    <div className='flex gap-6 flex-col'>
      <div className=''>

      <video style={{marginTop:'10px',width:'100%'}}  ref={videoRef} autoPlay playsInline />
      </div>
      
      {loading?<button className='bg-blue-600 p-6 m-2 rounded' >Loading...</button>:
      <button className='bg-blue-600 p-6 m-2 rounded' onClick={captureImage}>Tell me what you see.</button>
      
      }
      {capturedImage && (
        <div >
          <h1 className='p-2 text-xl'>Scene:</h1>
          <p className='p-2  font-medium  text-lg'>{caption}</p>

          {caption && (
            <div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CameraCapture;
