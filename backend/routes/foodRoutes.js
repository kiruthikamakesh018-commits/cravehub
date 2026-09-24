const router = require("express").Router();

const Food = require("../models/Food");

const {
  protect,
  adminOnly
} = require("../middleware/auth");


// GET ALL FOODS
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      category = ""
    } = req.query;

    const q = {};

    if (search) {
      q.name = {
        $regex: search,
        $options: "i"
      };
    }

    if (category && category !== "All") {
      q.category = category;
    }

    const foods = await Food.find(q)
      .sort({ createdAt: -1 });

    res.json(foods);

  } catch (e) {
    res.status(500).json({
      message: e.message
    });
  }
});


// ADD FOOD
router.post(
  "/",
  protect,
  adminOnly,
  async (req, res) => {
    try {

      const food = await Food.create({
        name: req.body.name,
        description: req.body.description || "",
        price: Number(req.body.price),
        category: req.body.category,
        image: req.body.image || "",
        available:
          req.body.available !== undefined
            ? req.body.available
            : true
      });

      res.status(201).json(food);

    } catch (e) {

      res.status(400).json({
        message: e.message
      });

    }
  }
);


// UPDATE FOOD
router.put(
  "/:id",
  protect,
  adminOnly,
  async (req, res) => {
    try {

      const food = await Food.findByIdAndUpdate(
        req.params.id,
        {
          name: req.body.name,
          description: req.body.description || "",
          price: Number(req.body.price),
          category: req.body.category,
          image: req.body.image || "",
          available:
            req.body.available !== undefined
              ? req.body.available
              : true
        },
        {
          new: true,
          runValidators: true
        }
      );

      if (!food) {
        return res.status(404).json({
          message: "Food not found"
        });
      }

      res.json(food);

    } catch (e) {

      res.status(400).json({
        message: e.message
      });

    }
  }
);


// DELETE FOOD
router.delete(
  "/:id",
  protect,
  adminOnly,
  async (req, res) => {
    try {

      const food =
        await Food.findByIdAndDelete(
          req.params.id
        );

      if (!food) {
        return res.status(404).json({
          message: "Food not found"
        });
      }

      res.json({
        message: "Food deleted"
      });

    } catch (e) {

      res.status(400).json({
        message: e.message
      });

    }
  }
);


module.exports = router;