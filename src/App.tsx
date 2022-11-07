import { Button, IconButton, styled, Tab, Tabs, TextField } from "@mui/material";
import { useState } from "react";
import { Colors } from "./colors";
import MicIcon from "@mui/icons-material/Mic";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import { config } from "./config";
import Recorder from "recorder-js";

function App() {
  const [state, setState] = useState(States.NaturalLanguageQuery);
  const [formalQuery, setFormalQuery] = useState<string>();
  const [queryResult, setQueryResult] = useState<string>();

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
      <Tabs value={state} onChange={(_, newState: States) => setState(newState)}>
        <Tab label="Natural language command" />
        <Tab label="Formal query" disabled={!formalQuery} />
        <Tab label="Query results" disabled={!queryResult} />
      </Tabs>
      <NaturalLanguageQueryView
        isShown={state === States.NaturalLanguageQuery}
        callback={naturalLanguageQueryViewCallback}
      />
      <FormalQueryView
        isShown={state === States.FormalQuery}
        query={formalQuery ?? ""}
        callback={formalQueryViewCallback}
      />
      <QueryResultView isShown={state === States.QueryResult} result={queryResult ?? ""} />
    </Main>
  );
}

function NaturalLanguageQueryView({
  isShown,
  callback,
}: {
  isShown: boolean;
  callback: (formalQuery: string) => void;
}) {
  const [inputType, setInputType] = useState(NaturalLanguageInputTypes.Text);

  if (!isShown) {
    return (
      <>
        <TextQueryInputView isShown={false} callback={callback} />
        <AudioQueryInputView isShown={false} callback={callback} />
      </>
    );
  }

  return (
    <>
      <Title>Provide your command</Title>

      <Tabs value={inputType} onChange={(_, newType: NaturalLanguageInputTypes) => setInputType(newType)}>
        <Tab label="By text" />
        <Tab label="By voice" />
      </Tabs>

      <TextQueryInputView isShown={inputType === NaturalLanguageInputTypes.Text} callback={callback} />
      <AudioQueryInputView isShown={inputType === NaturalLanguageInputTypes.Voice} callback={callback} />
    </>
  );
}

function TextQueryInputView({ isShown, callback }: { isShown: boolean; callback: (formalQuery: string) => void }) {
  const [textQuery, setTextQuery] = useState("");

  if (!isShown) return null;

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
      .then((command) => callback(command.trim()))
      .catch((error) => console.error(error));
  }
}

function AudioQueryInputView({ isShown, callback }: { isShown: boolean; callback: (formalQuery: string) => void }) {
  const [recorder, setRecorder] = useState<Recorder>();
  const [audioBlob, setAudioBlob] = useState<Blob>();
  const [textQuery, setTextQuery] = useState<string>();

  if (!isShown) return null;

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
      .then((command) => callback(command.trim()))
      .catch((error) => console.error(error));
  }
}

function FormalQueryView({
  isShown,
  query,
  callback,
}: {
  isShown: boolean;
  query: string;
  callback: (queryResult: string) => void;
}) {
  const [formalQuery, setFormalQuery] = useState(query);
  if (!isShown) return null;

  return (
    <>
      <Title>Your query is:</Title>
      <TextField
        multiline
        sx={{ width: "600px" }}
        label="Your query"
        value={formalQuery}
        onChange={(e) => setFormalQuery(e.target.value)}
      />

      <button onClick={() => callback("TestValue1, TestValue2")}>Send</button>
    </>
  );
}

function QueryResultView({ isShown, result }: { isShown: boolean; result: string }) {
  if (!isShown) return null;

  return (
    <>
      <Title>Result:</Title>
      <textarea readOnly>{result}</textarea>
    </>
  );
}

enum States {
  NaturalLanguageQuery,
  FormalQuery,
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

const Title = styled("h4")({
  fontSize: "26px",
  lineHeight: "30px",
  fontWeight: "bold",
  color: Colors.Black,
  margin: "40px 0 40px",
});

export default App;
