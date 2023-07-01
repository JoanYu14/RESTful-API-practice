const express = require("express");
const mongoose = require("mongoose");
const app = express();
// 在mongooseModel資料夾的student.js這個檔案內已經設定好Student這個model，並設定module.exports = Student，所以require("./mongooseModel/student") return就是Student這個modle
const Student = require("./mongooseModel/student");
app.set("view engine", "ejs");

// express.json()會去檢查requests的header有沒有Content-Type: application/json。如果有，就把text-based JSON換成JavaScript能夠存取的JSON物件，然後放入req.body。
app.use(express.json());
// express.urlencoded()會去檢查requests的header有沒有Content-Type: application/x-www-form-urlencoded （也就是去檢查是不是帶有資料的POST、PUT、PATCH）
// 如果有，也把text-based JSON換成JavaScript能夠存取的JSON物件然後放入req.body。
app.use(express.urlencoded({ extended: true }));

// 連接到本機的MongoDB的exampleDB這個database
mongoose
  .connect("mongodb://127.0.0.1:27017/exampleDB")
  .then(() => {
    console.log(
      "已成功連結到位於本機port 27017的mongoDB，並且連結到mongoDB中exampleDB這個database了"
    );
  })
  .catch((e) => {
    console.log(e);
  });

// ==========================================================================================================================================================================================================
// GET所有學生資料
// 如果對http://localhost:3000/students寄送一個get response就會被這個route接收
app.get("/students", async (req, res) => {
  try {
    let docArr = await Student.find().exec();
    return res.send(docArr); // 加上return是為了讓try的程式碼執行到這就結束了，不要再往下執行(如果try中res.send(data)下面還有程式碼的話那些程式碼就不會被執行)
  } catch (e) {
    // 如果執行這個程式碼代表客戶端寄出的response確實有被這個route接收到，但是在執行try內部的動作時有發生錯誤，所以是server這裡自己的錯誤，因此寄送的response的狀態要改成500(沒改的話就是send()預設的200OK)
    // 因為method chaining所以，res.status()其實會return response object，所以可以這樣寫
    return res.status(500).send("尋找資料時伺服器發生錯誤"); // 加上return是為了讓catch的程式碼執行到這就結束了
  }
});

// GET指定_id學生的資料
// 任何寫在localhost:3000/students/之後的字串都會被當成req.params._id屬性的值
app.get("/students/:_id", async (req, res) => {
  try {
    // Student.findOne()會去尋找students這個collection中第一筆符合_id屬性的值為req.params._id屬性的值的document
    // _id屬性為在collection中儲存一個document時自動給的屬性與值，相當於這個document的primary key
    // 因為filter是看_id是屬性，所以只要沒有符合_id的形式(12 個字節的字符串或 24 個十六進製字符的字符串或整數)就會直接出錯(rejected)而不是得到null結果
    // 因為await關鍵字，所以Student.findOne().exec()所return的不是一個pending狀態promise物件，而是這個異步函式的執行結果(變成fulfilled狀態後promise物件的值)
    let { _id } = req.params; // 利用物件的解構賦值語法把req.parms物件中名為_id屬性的值存到_id變數中
    console.log(_id);
    let document = await Student.findOne({ _id }).exec(); // { _id }為_id : _id的簡化寫法

    console.log(document);
    // 把包含document的狀態為200OK的Response寄回客戶端
    return res.send(document);
  } catch (e) {
    console.log(e);
    return res.status(500).send(e.message);
  }
});

// ==========================================================================================================================================================================================================
// POST學生資料(新增學生資料到資料庫中)
// 對http://localhost:3000/students寄送一個POST response就會被這個route接收
// 因為有使用express.urlencoded()這個middleware，所以post request所傳遞的資料就會從JSON解析成JS能存取的資料，並被存進req.body這個物件中
app.post("/students", async (req, res) => {
  try {
    let { name, age, major, merit, other } = req.body; // 利用解構賦值語法從req.body這個物件中取得這些屬性的值，並存入這些變數中
    console.log(name, age, major, merit, other);
    let newStudent = new Student({
      name, // name:name的簡化寫法
      age,
      major,
      schlarship: {
        merit, // merit:merit的簡化寫法
        other,
      },
    });

    // 因為await關鍵字，所以newStudent.save()回傳的就不是一個promise物件，而是newStudent這個物件本身(.save()的執行結果)
    // 並且因為await關鍵字，所以在app.post的異步的callbackFn中，這個callbackFn就會停在這裡，直到newStudent.save()執行完畢(fulfilled就繼續執行try的下方程式碼，rejected就執行catch函式)
    let savedStudent = await newStudent.save();

    // 回傳一個內容為一個物件的200OK的Response給客戶端
    return res.send({
      msg: "資料儲存成功",
      savedObject: savedStudent,
    });
  } catch (e) {
    return res
      .status(400)
      .send(`儲存資料時伺服器發生錯誤，錯誤訊息${e.message}`); // error object中有一個叫做message的屬性，他的值就是錯誤訊息
  }
});

// ==========================================================================================================================================================================================================
// PUT修改特定學生的資料(完全覆寫)
// 對http://localhost:3000/students/XXXX寄送一個PUT response就會被這個route接收
// 任何寫在localhost:3000/students/之後的字串都會被當成req.params._id屬性的值
app.put("/students/:_id", async (req, res) => {
  try {
    // 因為PUT Request的header中有Content-Type: application/x-www-form-urlencoded
    // 所以content裡的JSON資料也會透過express.urlencoded()這個中介軟體處理為JS可存取的資料並放入req物件的body物件中
    let { name, age, major, merit, other } = req.body;
    let { _id } = req.params; // 利用物件的解構賦值把req.parms._id的值存入_id變數中

    // newData會存入Student.findOneAndUpdate().exec()的執行結果，就是修改後的document(因為有設定new:true)
    let newData = await Student.findOneAndUpdate(
      { _id },
      { name, age, major, schlarship: { merit, other } },
      {
        // options參數
        new: true, // 設定new為true就是findOneAndUpdate()執行的結果會return更新後的document
        runValidators: true, // 會對update參數給的物件檢查是否符合schema中有設定的validators的規定
        // overwrite: truec會使findOneAndUpdate會對找到的document的內容做完全的覆寫，因為HTTP PUT Request在通訊的定義上就是要求客戶端提供所有數據(要不要修改的都要給)
        overwrite: true,
      }
    ).exec();

    return res.send({ msg: "成功更新資料", updateData: newData });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// ==========================================================================================================================================================================================================
// PATCH修改特定學生的資料(只修改有提供資料的屬性)

// 先製作一個Class(contructor)來幫助我們後面直接製作update參數的物件，直接製作成物件就很適合用來更新內容，因為update參數是給一個物件
class NewData {
  constructor() {} // 沒有要繼承的屬性，所以constructor函式就為空的就好了

  // 用NewData這個Class製作出來的物件都會繼承這個method(也就是NewData的protorype屬性(一個物件)中有setProperty()這個函式，所以因為創造的物件的_proto_屬性指向NewData的protorype因此可以使用這個函式)
  // 這個method是用來設定物件中要有甚麼屬性的，會使用在for in loop中，因為req.body中不一定有所有的屬性，但patch就是要修改document的內容中客戶有給資料的屬性
  setProperty(key, value) {
    // key為屬性的名稱，value為key屬性的值
    if (key !== "merit" && key !== "other") {
      // 因為merit和other屬性是被包在schlarship物件中的，所以要另外處理
      this[key] = value; // 設定呼叫這個函式的物件的key屬性，並且值為value
    } else {
      this[`schlarship.${key}`] = value; // 如果是merit或other的話就要用這個方法去設定物件的屬性與值
    }
  }
}

// 對http://localhost:3000/students/XXXX寄送一個PATCH response就會被這個route接收
// 任何寫在localhost:3000/students/之後的字串都會被當成req.params._id屬性的值
app.patch("/students/:_id", async (req, res) => {
  try {
    let { _id } = req.params; // 利用物件的解構賦值把req.parms._id的值存入_id變數中
    let newObject = new NewData(); // 用newData製作一個物件(此時是只有setProperty()這個method的物件)

    // 用for in loop循環一個JS物件中所有的可枚舉屬性(enumerable properties)，對於物件來說可枚舉屬性就是keys
    // 看patch request中給了幾個屬性資料req.body中就會有幾個屬性，也就是for in loop會循環幾次
    for (let property in req.body) {
      // 第n次循環property都會放入req.body的第n個屬性的名稱(key)

      // 用newObject從newData這個class繼承來的setProperty()這個method就可以設定newObject本身的屬性了。
      // 第一個參數就是要設定的屬性的名稱，第二個參數就是這個屬性的值為何
      newObject.setProperty(property, req.body[property]); // 要在for in loop中要用屬性名稱(key)取得value一定要用中括號[]
    }

    // newData會存入Student.findOneAndUpdate().exec()的執行結果，就是修改後的document(因為有設定new:true)
    let newData = await Student.findOneAndUpdate({ _id }, newObject, {
      new: true,
      runValidators: true,
      // 不能寫overwrite: true，寫了會完全覆改，就會變成put request要做的事了
    });
    res.send({ msg: "成功更新學生的部分資料!", updatedData: newData });
  } catch (e) {
    return res.status(400).send(e.message);
  }
});

// ==========================================================================================================================================================================================================
// DELETE特定_id的學生
app.delete("/students/:_id", async (req, res) => {
  try {
    let { _id } = req.params;
    // 如果是用_id屬性當condition參數的話，只要collection中沒有符合的_id就會直接變成rejected，如果是用其他屬性例如age,name的話就還是能成功，但不會刪除任何東西
    let deleteResult = await Student.deleteOne({ _id });
    return res.send(deleteResult);
  } catch (e) {
    return res.status(500).send(e.message);
  }
});

app.listen(3000, () => {
  console.log("伺服器正在聆聽port 3000...");
});
