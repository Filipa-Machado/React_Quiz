import { useEffect, useReducer } from "react";
import Header from "./Header";
import Main from "./Main";
import Loader from "./Loader";
import Error from "./Error";
import StartScreen from "./StartScreen";
import Question from "./Question";
import NextButton from "./NextButton";
import Progress from "./Progress";
import FinishScreen from "./FinishScreen";
import Timer from "./Timer";
import Footer from "./Footer";

const SECS_PER_QUESTION = 30;

const initialState = {
  questions: [],
  filterQuestions: [],
  // 'loading, 'error, 'ready', 'active', 'finished'
  status: "loading",
  index: 0,
  answer: null,
  answers: [],
  points: 0,
  highscore: JSON.parse(localStorage.getItem("highscore")) ?? 0,
  secondsRemaining: 10,
  difficulty: "all",
};

function reducer(state, action) {
  switch (action.type) {
    case "dataReceived":
      return {
        ...state,
        questions: action.payload,
        status: "ready",
        filterQuestions: action.payload,
      };
    case "dataFailed":
      return {
        ...state,
        status: "error",
      };
    case "start":
      return {
        ...state,
        status: "active",
        secondsRemaining: state.filterQuestions.length * SECS_PER_QUESTION,
      };
    case "newAnswer":
      //which is the current question?
      const question = state.filterQuestions.at(state.index);

      return {
        ...state,
        answer: action.payload,
        points:
          action.payload === question.correctOption
            ? state.points + question.points
            : state.points,
      };
    case "nextQuestion":
      const iterator =
        state.index + 1 < state.filterQuestions.length
          ? state.index + 1
          : state.index;

      return {
        ...state,
        index: iterator,
        answer: state.answers.at(iterator) ? state.answers.at(iterator) : null,
      };
    case "finish":
      const highscore =
        state.points >= state.highscore ? state.points : state.highscore;

      localStorage.setItem("highscore", JSON.stringify(highscore));

      return {
        ...state,
        status: "finished",
        highscore,
      };
    case "restart":
      return {
        ...initialState,
        highscore: state.highscore,
        questions: state.questions,
        status: "ready",
        filterQuestions: state.filterQuestions,
        difficulty: state.difficulty,
      };
    //{...state, points: 0, highscore: 0, index:0, answer:"null", status:"ready"}
    case "tick":
      return {
        ...state,
        secondsRemaining: state.secondsRemaining - 1,
        status: state.secondsRemaining === 0 ? "finished" : state.status,
      };
    case "setDifficulty":
      return {
        ...state,
        difficulty: action.payload,
        filterQuestions:
          action.payload === "all"
            ? state.questions
            : state.questions.filter(
                (question) => question.difficulty === action.payload
              ),
      };

    default:
      throw new Error("Action unknown");
  }
}

export default function App() {
  const [
    {
      filterQuestions,
      status,
      index,
      answer,
      points,
      highscore,
      secondsRemaining,
      difficulty,
    },
    dispatch,
  ] = useReducer(reducer, initialState);

  const numQuestions = filterQuestions?.length;

  console.log(filterQuestions);

  const maxPossiblePoints = filterQuestions.reduce(
    (prev, cur) => prev + cur.points,
    0
  );

  useEffect(function () {
    fetch("http://localhost:8000/questions")
      .then((res) => res.json())
      .then((data) => {
        dispatch({ type: "dataReceived", payload: data });
        console.log(data);
      })
      .catch((err) => dispatch({ type: "dataFailed" }));
  }, []);

  return (
    <div className="app">
      <Header />
      <Main>
        {status === "loading" && <Loader />}
        {status === "error" && <Error />}
        {status === "ready" && (
          <StartScreen
            numQuestions={numQuestions}
            dispatch={dispatch}
            highscore={highscore}
            difficulty={difficulty}
          />
        )}
        {status === "active" && (
          <>
            <Progress
              index={index}
              numQuestions={filterQuestions.length}
              points={points}
              maxPossiblePoints={maxPossiblePoints}
              answer={answer}
            />
            <Question
              question={filterQuestions.at(index)}
              dispatch={dispatch}
              answer={answer}
              status={status}
            />
            <Footer>
              <Timer dispatch={dispatch} secondsRemaining={secondsRemaining} />
              <NextButton
                dispatch={dispatch}
                answer={answer}
                numQuestions={filterQuestions.length}
                index={index}
                status={status}
              />
            </Footer>
          </>
        )}
        {status === "finished" && (
          <FinishScreen
            points={points}
            maxPossiblePoints={maxPossiblePoints}
            highscore={highscore}
            dispatch={dispatch}
          />
        )}
      </Main>
    </div>
  );
}
