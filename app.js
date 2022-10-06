const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
let message;

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.set('view engine', 'ejs');

mongoose.connect("mongodb+srv://admin-micoliser:642654737@cluster0.yythsez.mongodb.net/todolistDB");

const todolistSchema = {
  name: {
    type: String,
    required: [true, "Cannot add todolist without name"]
  }
};

const Item = mongoose.model("item", todolistSchema);

const item1 = new Item ({
  name: "Welcome to your todolist"
});
const item2 = new Item ({
  name: "Hit the + button to add a new item"
});
const item3 = new Item ({
  name: "Hit the checkbox to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: {
    type: String,
    required: [true, "List name not provided"]
  },
  items: [todolistSchema]
}

const List = mongoose.model("list", listSchema);

app.get("/", (req, res) => {
  Item.find({}, (err, foundItems) => {
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, (err) => {
          if (err) console.log(err);
          else console.log("succesfully added items");
        });
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: "Today",
          newListItems: foundItems,
          message: message
        });
      }
    }
  });
});

app.get("/:list", (req, res) => {
  const customListName = _.capitalize(req.params.list);

  List.findOne({name: customListName}, (err, foundItem) => {
    if (!err) {
      if (!foundItem) {
        // Create a new list
        const newList = new List ({
          name: customListName,
          items: defaultItems
        });

        newList.save();

        res.redirect("/" + customListName);
      } else {
        // Show an existing list
        res.render("list", {
          listTitle: foundItem.name,
          newListItems: foundItem.items,
          message: message
        });
      }
    }
  });
});

app.get("/about", (req, res) => {
  res.render("about");
})

app.post("/", (req, res) => {
  const itemName = req.body.nextItem;
  const listName = req.body.list;

  const newItem = new Item ({
    name: itemName,
  });

  if (listName === "Today") {
    message = "New list '" + itemName + "' added to " + listName + " list";
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(newItem);
      message = "New list '" + itemName + "' added to " + listName + " list";
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", (req, res) => {
  const itemId = req.body.checkbox;
  const listName = req.body.list;

  if (listName === "Today") {
    Item.findByIdAndRemove(itemId, (err) => {
      if (err) console.log(err);
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}, (err, foundList) => {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, () => {
  console.log("Server started successfully");
});
