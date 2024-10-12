import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const Quiz = ({ onLogout }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    const savedQuizData = localStorage.getItem("quizData");
    if (savedQuizData) {
      const {
        questions,
        currentQuestionIndex,
        score,
        timeLeft,
        wrongAnswers,
        totalAnswered,
      } = JSON.parse(savedQuizData);
      setQuestions(questions);
      setCurrentQuestionIndex(currentQuestionIndex);
      setScore(score);
      setTimeLeft(timeLeft);
      setWrongAnswers(wrongAnswers);
      setTotalAnswered(totalAnswered);
    } else {
      fetchQuestions();
    }
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(
        "https://opentdb.com/api.php?amount=5&type=multiple"
      );
      setQuestions(response.data.results);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.error("Rate limit exceeded. Please try again later.");
      } else {
        console.error("Failed to fetch questions:", error);
      }
    }
  };

  const saveQuizData = useCallback(() => {
    localStorage.setItem(
      "quizData",
      JSON.stringify({
        questions,
        currentQuestionIndex,
        score,
        timeLeft,
        wrongAnswers,
        totalAnswered,
      })
    );
  }, [
    questions,
    currentQuestionIndex,
    score,
    timeLeft,
    wrongAnswers,
    totalAnswered,
  ]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setTimeLeft(15);
      saveQuizData();
    } else {
      setQuizFinished(true);
      localStorage.removeItem("quizData");
    }
  }, [currentQuestionIndex, questions.length, saveQuizData]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleNextQuestion();
    }
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime > 0 ? prevTime - 1 : 0;
        saveQuizData();
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleNextQuestion, saveQuizData]);

  const handleAnswerClick = (answer) => {
    const currentQuestion = questions[currentQuestionIndex];
    setTotalAnswered((prevTotal) => prevTotal + 1);

    if (answer === currentQuestion.correct_answer) {
      setScore((prevScore) => prevScore + 1);
    } else {
      setWrongAnswers((prevWrong) => prevWrong + 1);
    }

    setTimeout(() => {
      handleNextQuestion();
    }, 500);
  };

  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setWrongAnswers(0);
    setTotalAnswered(0);
    setTimeLeft(15);
    setQuizFinished(false);
    localStorage.removeItem("quizData");
    fetchQuestions();
  };

  if (!questions.length) return <div className="text-center">Loading...</div>;

  if (quizFinished) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold">Kuis Selesai!</h1>
        <p className="mt-4">
          Skor Anda: {score} dari {questions.length}
        </p>
        <p className="mt-2">Jawaban Benar: {score}</p>
        <p className="mt-2">Jawaban Salah: {wrongAnswers}</p>
        <p className="mt-2">Total Soal Dijawab: {totalAnswered}</p>
        <div className="mt-4">
          <button
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mr-2"
            onClick={handlePlayAgain}
          >
            Main Lagi
          </button>
          <button
            className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">
        Soal {currentQuestionIndex + 1} dari {questions.length}
      </h2>
      <h2 className="text-xl font-bold mb-4">
        Kategori: {currentQuestion.category}
      </h2>
      <p className="mb-6">{currentQuestion.question}</p>
      <div className="mb-6">
        {currentQuestion.incorrect_answers
          .concat(currentQuestion.correct_answer)
          .sort()
          .map((answer) => (
            <button
              key={answer}
              className="block w-full mb-2 py-2 px-4 border rounded bg-white hover:bg-blue-500 hover:text-white"
              onClick={() => handleAnswerClick(answer)}
            >
              {answer}
            </button>
          ))}
      </div>
      <div className="flex justify-between items-center">
        <p>Waktu Tersisa: {timeLeft} detik</p>
      </div>
    </div>
  );
};

export default Quiz;
