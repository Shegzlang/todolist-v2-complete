// must be at the top
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// const request = require("request");
// const https = require("https");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.q37ghry.mongodb.net/${process.env.DB_NAME}`
  )
  .then(() => console.log("connected successfully to MongoDB via Mongoose"))
  .catch((err) => console.error(err));

// Define the schema; validator put in rating
const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "check your data entry, no name specified!"],
  },
});

// Create the model
const Item = mongoose.model("Item", itemsSchema);

// Create a documents
const item1 = new Item({ name: "Welcome to your todo list!" });
const item2 = new Item({ name: "Hit the + button to add a new item." });
const item3 = new Item({ name: "<-- Hit this to delete an item" });

const defaultItems = [item1, item2, item3];

// Define the schema;
const listSchema = {
  name: String,
  items: [itemsSchema],
};

// Create the model
const List = mongoose.model("List", listSchema);

// async function insert() {}
// insert();

// for the root route
app.get("/", async (req, res) => {
  // READ: Find all documents
  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      console.log("all saved to DB!");
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
      // console.log(foundItems);
    }
  } catch (err) {
    console.error("error:", err);
  }
});

// dynamic addresses
app.get("/:customListName", async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  const foundList = await List.findOne({ name: customListName }).exec();
  if (foundList) {
    console.log("match found!");

    // show an existing list
    res.render("list", {
      listTitle: foundList.name,
      newListItems: foundList.items,
    });
  } else {
    console.log("match not found!");

    // create a new list
    const list = new List({
      name: customListName,
      items: defaultItems,
    });
    list.save();
    res.redirect("/" + customListName);
  }
});

// for the root route - form
app.post("/", async (req, res) => {
  const itemName = req.body.newItem; // trim() for whitespace
  const listName = req.body.list;

  const item = new Item({ name: itemName });

  if (listName === "Today") {
    await item.save(); // wait for save before redirect
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName }); // wait and store result

    if (foundList) {
      foundList.items.push(item);
      await foundList.save(); // wait for save
      res.redirect("/" + listName);
    } else {
      console.error("List not found: " + listName);
      res.redirect("/"); // Fallback redirect
    }
  }
});

// for the delete route
app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    await Item.findByIdAndDelete(checkedItemId);
    console.log("successfully deleted checked item!");
    res.redirect("/");
  } else {
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    );
    res.redirect("/" + listName);
  }
});

let port = process.env.port;
if (port == null || "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server is running on port 3000");
});

// former if statements replaced by switch as they got much
//     switch (currentDay) {
//         case 0:
//             day = "Sunday";
//             break;
//         case 1:
//             day = "Monday";
//             break;
//         case 2:
//             day = "Tuesday";
//             break;
//         case 3:
//             day = "Wednesday";
//             break;
//         case 4:
//             day = "Thursday";
//             break;
//         case 5:
//             day = "Friday";
//             break;
//         case 6:
//             day = "Saturday";
//             break;
//         default:
//             break;
//             console.log("Error: current day is equal to: " + currentDay);
//     }

// replaced by switch statements
// var currentDay = today.getDay();
//     var day = "";
// if (currentDay === 6 || currentDay === 0) {
//         day = "Weekend";
//         // res.send("<h1>Yay! Its the weekend!</h1>");
//     } else {
//         // res.send("<h1>Boo! I have to work!</h1>");
//         // res.sendFile(__dirname + "/index.html");
//         day = "Weekday";
//     }
