let video = document.getElementById("video"); 
let canvas = document.body.appendChild(document.createElement("canvas")); 
let ctx = canvas.getContext("2d"); 
let displaySize;

//Ukuran resolusi kamera
let width = 1280;
let height = 720;

const getVideoDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === "videoinput");
};

// Function untuk mengambil gambar dari kamera
const startSteam = async (deviceId) => {
  console.log("----- START STEAM ------");
  const constraints = {
    //Mengatur besaran vidio untuk dapat ideal dengan device
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      width: { ideal: width },
      height: { ideal: height },
    },

    audio: false, 
  };
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
  } catch (err) {
    console.error("Error accessing media devices.", err);
  }
};

const initialize = async () => {
  console.log(faceapi.nets);

  console.log("----- START LOAD MODEL ------");
  await Promise.all([
    faceapi.nets.ageGenderNet.loadFromUri("models"),
    faceapi.nets.ssdMobilenetv1.loadFromUri("models"),
    faceapi.nets.tinyFaceDetector.loadFromUri("models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("models"),
    faceapi.nets.faceExpressionNet.loadFromUri("models"),
  ]);

  const videoDevices = await getVideoDevices();
  if (videoDevices.length > 0) {
    startSteam(videoDevices[0].deviceId); 
  } else {
    console.error("No video devices found.");
  }
};

initialize();

async function detect() {
  const detections = await faceapi
    .detectAllFaces(video)
    .withFaceLandmarks()
    .withFaceExpressions()
    .withAgeAndGender();
  //console.log(detections);

  ctx.clearRect(0, 0, width, height);
  const resizedDetections = faceapi.resizeResults(detections, displaySize);
  faceapi.draw.drawDetections(canvas, resizedDetections);
  faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
  faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

  console.log(resizedDetections);
  resizedDetections.forEach((result) => {
    const { age, gender, genderProbability } = result;
    new faceapi.draw.DrawTextField(
      [
        `${Math.round(age, 0)} Tahun`,
        `${gender} ${Math.round(genderProbability)}`,
      ],
      result.detection.box.bottomRight
    ).draw(canvas);
  });
}

video.addEventListener("play", () => {
  displaySize = { width: 500, height: 500 }; // Update these values to match the CSS
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(detect, 100);
});

