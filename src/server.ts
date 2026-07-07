import app from "./app.js";

const bootstrap = async () => {
  app.listen(process.env.PORT, () => {
    console.log(`Server running on ${process.env.PORT}`);
  });
};

if (process.env.NODE_ENV === "development") {
  bootstrap();
}

export default app;
