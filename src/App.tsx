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
      <SiteTitle>Natural interface to your Db</SiteTitle>
      <Tabs value={state} onChange={(_, newState: States) => setState(newState)}>
        <Tab label="Natural language command" />
        <Tab label="Formal query" disabled={formalQuery === undefined} />
        <Tab label="Query results" disabled={queryResult === undefined} />
      </Tabs>
      <NaturalLanguageQueryView
        isShown={state === States.NaturalLanguageQuery}
        callback={naturalLanguageQueryViewCallback}
      />
      <FormalQueryView
        isShown={state === States.FormalQuery}
        setQuery={setFormalQuery}
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
}: Readonly<{
  isShown: boolean;
  callback: (formalQuery: string) => void;
}>) {
  const [inputType, setInputType] = useState(NaturalLanguageInputTypes.Text);

  return (
    <>
      {isShown && (
        <>
          <StateTabTitle>Provide your command</StateTabTitle>
          <Tabs value={inputType} onChange={(_, newType: NaturalLanguageInputTypes) => setInputType(newType)}>
            <Tab label="By text" />
            <Tab label="By voice" />
          </Tabs>
        </>
      )}

      <TextQueryInputView isShown={isShown && inputType === NaturalLanguageInputTypes.Text} callback={callback} />
      <AudioQueryInputView isShown={isShown && inputType === NaturalLanguageInputTypes.Voice} callback={callback} />
    </>
  );
}

function TextQueryInputView({ isShown, callback }: Readonly<{ isShown: boolean; callback: (sql: string) => void }>) {
  const [textQuery, setTextQuery] = useState<string>();

  if (!isShown) return null;

  const text = textQuery ?? "";
  return (
    <>
      <TextField
        multiline
        sx={{ width: "600px" }}
        label="Your query"
        value={text}
        onChange={(e) => setTextQuery(e.target.value)}
      />
      <Button sx={{ marginTop: "10px" }} onClick={() => convertTextToSql(text, callback)} disabled={!textQuery}>
        Generate formal query
      </Button>
    </>
  );
}

function AudioQueryInputView({ isShown, callback }: Readonly<{ isShown: boolean; callback: (sql: string) => void }>) {
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
      <Button onClick={() => convertTextToSql(textQuery ?? "", callback)} disabled={!textQuery}>
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
      .then((response) => response.json() as Promise<IAudioToTextResponse>)
      .then((response) => setTextQuery(response.text))
      .catch((error) => console.error(error));
  }

  interface IAudioToTextResponse {
    text: string;
  }
}

function FormalQueryView({
  isShown,
  query,
  setQuery,
  callback,
}: Readonly<{
  isShown: boolean;
  query: string;
  setQuery: (newFormalQuery: string) => void;
  callback: (queryResult: string) => void;
}>) {
  if (!isShown) return null;

  return (
    <>
      <StateTabTitle>Your query is:</StateTabTitle>
      <TextField
        multiline
        sx={{ width: "600px" }}
        label="Formal query"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <Button sx={{ marginTop: "10px" }} onClick={() => executeFormalQuery()}>
        Send
      </Button>
    </>
  );

  function executeFormalQuery() {
    fetch(config.backendUrl + "/execute-in-big-query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql: query }),
    })
      .then((response) => response.json() as Promise<IExecuteInBigQueryResponse>)
      .then((result) => callback(result.resultsInCsv.length > 0 ? result.resultsInCsv : "No results"))
      .catch((error) => console.error(error));
  }

  interface IExecuteInBigQueryResponse {
    resultsInCsv: string;
  }
}

function QueryResultView({ isShown, result }: Readonly<{ isShown: boolean; result: string }>) {
  if (!isShown) return null;

  return (
    <>
      <StateTabTitle>Result:</StateTabTitle>
      <TextField sx={{ width: "600px" }} multiline value={result} />
    </>
  );
}

function convertTextToSql(text: string, callback: (sql: string) => void) {
  fetch(config.backendUrl + "/text-to-sql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text }),
  })
    .then((response) => response.json() as Promise<ITextToSqlResponse>)
    .then((command) => callback(command.sql))
    .catch((error) => console.error(error));
}

interface ITextToSqlResponse {
  sql: string;
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

const SiteTitle = styled("h3")({
  fontSize: "32px",
  lineHeight: "40px",
  fontWeight: "bold",
  color: Colors.Black,
  margin: "12px 0 40px",
});

const StateTabTitle = styled("h4")({
  fontSize: "26px",
  lineHeight: "30px",
  fontWeight: "bold",
  color: Colors.Black,
  margin: "40px 0 40px",
});

export default App;
