import express, { Router } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

const router = Router();


router.get('/canTrade', (req, res) => {
    res.send('Hello, World!');
});

app.use(router);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
