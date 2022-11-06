import { Box, Button, styled, Tab, Tabs, TextField } from "@mui/material";
import { useState } from "react";
import { Colors } from "./colors";

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

  // return (
  //   <Main>
  //     <img src="/dog.png" />
  //     <Title>Natural Db</Title>
  //     <Box sx={{ width: "500px", display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
  //       {mediaRecorder ? (
  //         <button onClick={stopRecording}>Stop</button>
  //       ) : (
  //         <button onClick={startRecording}>Record</button>
  //       )}
  //       <button>Translate to text</button>
  //     </Box>
  //     {audioBlob && <audio controls src={URL.createObjectURL(audioBlob)}></audio>}
  //     <StyledForm onSubmit={onSubmit}>
  //       <TextField
  //         label="Input"
  //         sx={{ marginY: "20px" }}
  //         multiline
  //         maxRows={4}
  //         value={textQuery}
  //         onChange={(e) => setTextQuery(e.target.value)}
  //       />
  //       <Button type="submit" variant="contained">
  //         Send
  //       </Button>
  //     </StyledForm>
  //     <div>{result}</div>
  //   </Main>
  // );
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

      {inputType === NaturalLanguageInputTypes.Text && <p>Text input</p>}
      {inputType === NaturalLanguageInputTypes.Voice && <p>Voice input</p>}

      <button onClick={() => callback("SELECT * FROM test;")}>Generate formal query</button>
    </>
  );
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

const StyledForm = styled("form")({
  display: "flex",
  flexDirection: "column",
  width: "500px",
});

export default App;
