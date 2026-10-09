import {
  categories,
  questions,
  type PracticeQuestion,
  type Choice,
  type QuestionCategory,
  type AnswerKind,
} from "../data/demo";
import { gradeAnswer, summarize } from "./practice";
import { saveRecord } from "../services/local";

interface OptionView extends Choice {
  letter: string;
  selected: boolean;
  state: "default" | "selected" | "correct" | "wrong";
}
interface QuizData {
  type: string;
  title: string;
  answerKind: AnswerKind;
  list: PracticeQuestion[];
  question: PracticeQuestion | null;
  optionViews: OptionView[];
  index: number;
  total: number;
  answer: string;
  canSubmit: boolean;
  submitted: boolean;
  correct: boolean;
  displayAnswer: string;
  results: (boolean | null)[];
  progress: number;
  error: string;
  finished: boolean;
}
interface QuizContext {
  data: QuizData;
  setData(patch: Partial<QuizData>): void;
  chooseAnswer(value: string): void;
}
function optionViews(
  question: PracticeQuestion,
  answer = "",
  submitted = false,
): OptionView[] {
  return question.options.map((option, index) => ({
    ...option,
    letter: String.fromCharCode(65 + index),
    selected: option.id === answer,
    state:
      submitted && question.answers.includes(option.id)
        ? "correct"
        : submitted && option.id === answer
          ? "wrong"
          : option.id === answer
            ? "selected"
            : "default",
  }));
}

/** 四个答题页复用同一流程；题型决定选择或填空界面。 */
export function createQuizPage(fixedType?: QuestionCategory) {
  const data: QuizData = {
    type: "",
    title: "题库练习",
    answerKind: "fill",
    list: [],
    question: null,
    optionViews: [],
    index: 0,
    total: 0,
    answer: "",
    canSubmit: false,
    submitted: false,
    correct: false,
    displayAnswer: "",
    results: [],
    progress: 0,
    error: "",
    finished: false,
  };
  return {
    data,
    onLoad(this: QuizContext, options: Record<string, string | undefined>) {
      const type = fixedType || options.type || "";
      const category = categories.find((item) => item.id === type);
      const list = questions.filter((question) => question.type === type);
      if (!category || !list.length) {
        this.setData({ error: "这个练习暂时没有内容" });
        return;
      }
      wx.setNavigationBarTitle({ title: category.title });
      this.setData({
        type,
        title: category.title,
        answerKind: category.answerKind,
        list,
        question: list[0],
        optionViews: optionViews(list[0]),
        total: list.length,
        results: list.map(() => null),
        progress: 100 / list.length,
      });
    },
    input(
      this: QuizContext,
      event: WechatMiniprogram.CustomEvent<{ value: string }>,
    ) {
      if (this.data.submitted || this.data.answerKind !== "fill") return;
      const answer = event.detail.value;
      this.setData({ answer, canSubmit: answer.trim().length > 0 });
    },
    chooseAnswer(this: QuizContext, value: string) {
      const question = this.data.question;
      if (
        this.data.submitted ||
        this.data.answerKind !== "choice" ||
        !question ||
        !question.options.some((option) => option.id === value)
      )
        return;
      this.setData({
        answer: value,
        canSubmit: true,
        optionViews: optionViews(question, value),
      });
    },
    radioChange(
      this: QuizContext,
      event: WechatMiniprogram.CustomEvent<{ value: string }>,
    ) {
      this.chooseAnswer(event.detail.value);
    },
    select(this: QuizContext, event: WechatMiniprogram.CustomEvent) {
      this.chooseAnswer(String(event.currentTarget.dataset.id));
    },
    submit(this: QuizContext) {
      const question = this.data.question;
      if (this.data.submitted || !question) return;
      if (!this.data.canSubmit) {
        wx.showToast({
          title:
            this.data.answerKind === "choice"
              ? "请先选择一个选项"
              : "请先填写答案",
          icon: "none",
        });
        return;
      }
      const correct = gradeAnswer(this.data.answer, question.answers);
      const results = [...this.data.results];
      results[this.data.index] = correct;
      this.setData({
        submitted: true,
        correct,
        canSubmit: false,
        results,
        optionViews: optionViews(question, this.data.answer, true),
        displayAnswer:
          question.options.find((option) =>
            question.answers.includes(option.id),
          )?.label || question.answers[0],
      });
    },
    next(this: QuizContext) {
      if (!this.data.submitted || this.data.finished) return;
      const index = this.data.index + 1;
      if (index < this.data.total) {
        const question = this.data.list[index];
        this.setData({
          index,
          question,
          optionViews: optionViews(question),
          answer: "",
          canSubmit: false,
          submitted: false,
          correct: false,
          displayAnswer: "",
          progress: ((index + 1) / this.data.total) * 100,
        });
        return;
      }
      this.setData({ finished: true });
      const score = summarize(this.data.results);
      saveRecord(this.data.title, this.data.results);
      wx.redirectTo({
        url: `/pages/result/index?type=${this.data.type}&correct=${score.correct}&total=${score.total}&accuracy=${score.accuracy}`,
      });
    },
    back() {
      wx.navigateBack();
    },
  };
}
