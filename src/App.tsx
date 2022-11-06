import { Button, IconButton, styled, Tab, Tabs, TextField } from "@mui/material";
import { useState } from "react";
import { Colors } from "./colors";
import MicIcon from "@mui/icons-material/Mic";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import { config } from "./config";
import Recorder from "recorder-js";

function App() {
  const [state, setState] = useState(States.NaturalLanguageQuery);
  const [formalQuery, setFormalQuery] = useState<string>("");
  const [queryResult, setQueryResult] = useState<string>("");

  const naturalLanguageQueryViewCallback = (newFormalQuery: string) => {
    setState(States.FormalQuery);
    setFormalQuery(newFormalQuery);
  };

  const formalQueryViewCallback = (newQueryResult: string) => {
    setState(States.QueryResult);
    setQueryResult(newQueryResult);
  };

  return (
    <Main>
      <img src="/dog.png" />
      {state === States.NaturalLanguageQuery && (
        <NaturalLanguageQueryView callback={naturalLanguageQueryViewCallback} />
      )}
      {state === States.FormalQuery && <FormalQueryView query={formalQuery} callback={formalQueryViewCallback} />}
      {state === States.QueryResult && <QueryResultView result={queryResult} />}
    </Main>
  );
}

function NaturalLanguageQueryView({ callback }: { callback: (formalQuery: string) => void }) {
  const [inputType, setInputType] = useState(NaturalLanguageInputTypes.Text);

  return (
    <>
      <Title>Provide your command</Title>

      <Tabs value={inputType} onChange={(_, newType: NaturalLanguageInputTypes) => setInputType(newType)}>
        <Tab label="By text" />
        <Tab label="By voice" />
      </Tabs>

      {inputType === NaturalLanguageInputTypes.Text && <TextQueryInputView callback={callback} />}
      {inputType === NaturalLanguageInputTypes.Voice && <AudioQueryInputView callback={callback} />}
    </>
  );
}

function TextQueryInputView({ callback }: { callback: (formalQuery: string) => void }) {
  const [textQuery, setTextQuery] = useState("");

  return (
    <>
      <TextField
        multiline
        sx={{ width: "600px" }}
        label="Your query"
        value={textQuery}
        onChange={(e) => setTextQuery(e.target.value)}
      />
      <button onClick={onSubmit} disabled={!textQuery}>
        Generate formal query
      </button>
    </>
  );

  function onSubmit() {
    fetch(config.backendUrl + "/text-to-command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textQuery }),
    })
      .then((response) => response.text())
      .then(callback)
      .catch((error) => console.error(error));
  }
}

function AudioQueryInputView({ callback }: { callback: (formalQuery: string) => void }) {
  const [recorder, setRecorder] = useState<Recorder>();
  const [audioBlob, setAudioBlob] = useState<Blob>();
  const [textQuery, setTextQuery] = useState<string>();

  return (
    <>
      <p>Record your query</p>
      {recorder ? (
        <IconButton onClick={() => stopRecording()}>
          <StopCircleIcon />
        </IconButton>
      ) : (
        <IconButton onClick={() => startRecording()}>
          <MicIcon />
        </IconButton>
      )}

      {audioBlob && <audio controls src={URL.createObjectURL(audioBlob)}></audio>}
      <Button onClick={transformAudioToTextQuery}>Transform audio to text query</Button>
      {textQuery && (
        <TextField
          multiline
          sx={{ width: "600px" }}
          label="Your query"
          value={textQuery}
          onChange={(e) => setTextQuery(e.target.value)}
        />
      )}
      <Button onClick={onSubmit} disabled={!textQuery}>
        Generate formal query
      </Button>
    </>
  );

  function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const newRecorder = new Recorder(new AudioContext());
      newRecorder.init(stream);
      newRecorder.start();
      setAudioBlob(undefined);
      setTextQuery(undefined);
      setRecorder(newRecorder);
    });
  }

  function stopRecording() {
    if (!recorder) return;

    recorder.stop().then(({ blob }) => {
      setRecorder(undefined);
      setAudioBlob(new Blob([blob], { type: "audio/wav" }));
    });
  }

  function transformAudioToTextQuery() {
    if (!audioBlob) return;
    setTextQuery(undefined);
    const form = new FormData();
    form.append("file", audioBlob, "audio.wav");
    fetch(config.backendUrl + "/audio-to-text", {
      method: "POST",
      body: form,
    })
      .then((response) => response.text())
      .then(setTextQuery)
      .catch((error) => console.error(error));
  }

  function onSubmit() {
    fetch(config.backendUrl + "/text-to-command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textQuery }),
    })
      .then((response) => response.text())
      .then(callback)
      .catch((error) => console.error(error));
  }
}

function FormalQueryView({ query, callback }: { query: string; callback: (queryResult: string) => void }) {
  return (
    <>
      <Title>Your query is:</Title>
      <textarea>{query}</textarea>
      <button onClick={() => callback("TestValue1, TestValue2")}>Send</button>
    </>
  );
}

function QueryResultView({ result }: { result: string }) {
  return (
    <>
      <Title>Result:</Title>
      <textarea readOnly>{result}</textarea>
    </>
  );
}

enum States {
  NaturalLanguageQuery,
  LoadFormalQuery,
  FormalQuery,
  LoadQueryResult,
  QueryResult,
  Error,
}

enum NaturalLanguageInputTypes {
  Text,
  Voice,
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
  color: Colors.Black,
  margin: "16px 0 40px",
});

export default App;
