// 為了保持app.js程式碼的簡潔，所以mongoose相關的程式碼我們寫在這裡
// 每個JS檔的所有程式碼其實就是一個module，使用Node.js執行時我們的程式碼其實都被包進Module Wrapper(一個函式)中並且馬上被執行(IIFE)
// 所以我們設定module.exports這個屬性(原本是一個空物件)為設定好的Model(物件)
// 這樣其他JS檔中require("student")時就會return設定好的那個Model而不是一個IIFE的程式碼
// 在其他JS檔中require("student")時，整個module(程式碼)還是會全部執行一次，只是最後會return model而不是所有程式碼
const mongoose = require("mongoose");

// 連接到本機的MongoDB的exampleDB這個database
mongoose
  .connect("mongodb://127.0.0.1:27017/exampleDB")
  .then(() => {
    console.log(
      "student.js的mongoose已成功連結到位於本機port 27017的mongoDB，並且連結到mongoDB中exampleDB這個database了"
    );
  })
  .catch((e) => {
    console.log(e);
  });

// 利用物件的解構賦值的語法取得mongoose物件中名為Schema的屬性的值(一個constructor function)
const { Schema } = mongoose;

// 用Schema這個Constructor來製作一個schema，並存入名為studentSchema的變數中
const studentSchema = new Schema({
  name: {
    type: String,
    required: true, // required驗證器為true是代表name這個屬性一定要有值
    minlength: 2, // minlength驗證器值為2，代表新創建的物件save()時或update的物件的name屬性的字串長度不能小於2，小於的話會出錯
  },
  age: {
    type: Number,
    default: 18, // 如果新創建的物件的這age屬性，預設就會給這個屬性18的數值
    min: [0, "歲數不能小於0歲"], // 新創建的物件save()時或update的物件的name屬性的字串長度不能小於0，小於的話會出錯，並且錯誤訊息帶入陣列的第2個元素
  },

  major: {
    type: String,
    required: true,
    enum: [
      // 如果有人在major屬性填的值不符合enum陣列裡面的字串的話，就會操作失敗(rejected，save()或update()都是)
      "Chemistry",
      "Computer Science",
      "Finance",
      "English",
      "Math",
      "undecided",
    ],
  },

  schlarship: {
    merit: {
      type: Number,
      default: 0,
      min: [0, "校內獎學金不能為負數"],
      max: [5000, "學生的merti schlarship太多了"],
    },
    other: {
      type: Number,
      default: 0,
      min: [0, "校外獎學金不能為負數"],
    },
  },
});

const Student = mongoose.model("Student", studentSchema);
// 設定這個module的exports屬性變成Student這個model，這樣別的JS程式required("student")的時候就是會return這個model
module.exports = Student;
