import styled from "@emotion/styled";
import { Box, TextField } from "@mui/material";
import { useState } from "react";

function App() {
  const [textQuery, setTextQuery] = useState("");
  const [result, setResult] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>();
  const [audioBlob, setAudioBlob] = useState<Blob>();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult("Your query is: " + textQuery);
    setTextQuery("");
  }

  function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const newMediaRecorder = new MediaRecorder(stream);

      const audioChunks = [] as Blob[];
      newMediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });

      newMediaRecorder.addEventListener("stop", () => {
        setAudioBlob(new Blob(audioChunks));
      });

      setMediaRecorder(newMediaRecorder);
      setAudioBlob(undefined);
      newMediaRecorder.start();
    });
  }

  function stopRecording() {
    mediaRecorder?.stop();
    setMediaRecorder(undefined);
  }

  return (
    <Main>
      <img src="/dog.png" />
      <Title>Insert your command</Title>
      <Box sx={{ width: "500px", display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
        {mediaRecorder ? (
          <button onClick={stopRecording}>Stop</button>
        ) : (
          <button onClick={startRecording}>Record</button>
        )}
        <button>Translate to text</button>
      </Box>
      {audioBlob && <audio controls src={URL.createObjectURL(audioBlob)}></audio>}
      <StyledForm onSubmit={onSubmit}>
        <TextField
          label="Input"
          sx={{ marginY: "20px" }}
          multiline
          maxRows={4}
          value={textQuery}
          onChange={(e) => setTextQuery(e.target.value)}
        />
        <SubmitInput type="submit" value="Send " />
      </StyledForm>
      <div>{result}</div>
    </Main>
  );
}

const Main = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  paddingTop: "60px",
});

const Title = styled("h3")({
  fontSize: "32px",
  lineHeight: "40px",
  fontWeight: "bold",
  color: "#202123",
  margin: "16px 0 40px",
});

const StyledForm = styled("form")({
  display: "flex",
  flexDirection: "column",
  width: "500px",
});

const StyledInput = styled("input")({
  fontSize: "16px",
  lineHeight: "24px",
  color: "#353740",
  "&::placeholder": {
    color: "#8e8ea0",
    opacity: 1,
  },
});

const SubmitInput = styled(StyledInput)({
  padding: "12px 0",
  color: "#fff",
  backgroundColor: "#10a37f",
  border: "none",
  borderRadius: "4px",
  textAlign: "center",
  cursor: "pointer",
});

export default App;
