import { Router } from 'express';
import UserService from '../services/UserService.js';
import NumberMiddleware from '../middlewares/number.middleware.js';
import UserMiddleware from '../middlewares/user.middleware.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/create', async (req, res) => {
    const response = await UserService.createUser(req);
    res.status(response.code).json(response.message);
});
router.get(
    '/getAllUsers',
    [
        AuthMiddleware.validateToken,
    ],
    async (_, res) => {
        const response = await UserService.getAllActiveUsers();
        res.status(response.code).json(response.message);
    }
)
router.get(
    '/findUsers',
    [
        AuthMiddleware.validateToken,
    ],
    async (req, res) => {
        const response = await UserService.findUsers(req);
        res.status(response.code).json(response.message);
    }
)
router.get(
    '/:id',
    [
        NumberMiddleware.isNumber,
        UserMiddleware.isValidUserById,
        AuthMiddleware.validateToken,
        UserMiddleware.hasPermissions
    ],
    async (req, res) => {
        if (req.params.id === 'getAllUsers' || req.params.id === 'findUsers') return next(); //telling express to ignore if params is a subroute
        const response = await UserService.getUserById(req.params.id);
        res.status(response.code).json(response.message);
    });

router.put('/:id', [
        NumberMiddleware.isNumber,
        UserMiddleware.isValidUserById,
        AuthMiddleware.validateToken,
        UserMiddleware.hasPermissions,
    ],
    async(req, res) => {
        const response = await UserService.updateUser(req);
        res.status(response.code).json(response.message);
    });

router.delete('/:id',
    [
        NumberMiddleware.isNumber,
        UserMiddleware.isValidUserById,
        AuthMiddleware.validateToken,
        UserMiddleware.hasPermissions,
    ],
    async (req, res) => {
       const response = await UserService.deleteUser(req.params.id);
       res.status(response.code).json(response.message);
    });

export default router;