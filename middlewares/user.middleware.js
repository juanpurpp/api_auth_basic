import db from '../dist/db/models/index.js';

const isValidUserById = async (req, res, next) => {
    const id = req.params.id;
    const response = await db.User.findOne({
        where: {
            id: id,
            status: true,
        }
    });
    if (!response) {
        return res.status(404).json({
            message: 'User not found'
        });
    }
    next();
};

const hasPermissions = async (req, res, next) => {
    const token = req.headers.token;
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('ascii'));
    if(!payload.roles.includes('admin')){
        if(payload.id !== +req.params.id){
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }
    }
    next();
}

const arrayValidFormat = async (req, res, next) => {
    const newUsers = req.body;
    if (!Array.isArray(newUsers)) {
        return res.status(400).json({
            message: 'Body must be an array'
        });
    }
    if (newUsers.length === 0) {
        return res.status(400).json({
            message: 'Array must have at least one element'
        });
    }
    if (newUsers.some(element => typeof element !== 'object')) {
        return res.status(400).json({
            message: 'Array must have only objects'
        });
    }
    if (newUsers.some(element => Object.keys(element).length === 0)) {
        return res.status(400).json({
            message: 'Objects must have at least one key'
        });
    }

    const load = []
    for(const user of newUsers) {
        const exists = await db.User.findOne({
            where: {
                email: user.email,
            }
        });

        if (exists) continue;
        if (user.name === '' || typeof user.name !== 'string') continue;
        if (user.email === '' || typeof user.email !== 'string') continue;
        if (user.password === '' || typeof user.password !== 'string') continue;
        if (user.cellphone === '' || typeof user.cellphone !== 'string') continue;
        load.push(user);
    }
    res.locals.load = load
    res.locals.eliminated = newUsers.length - load.length
    next();
}
export default {
    isValidUserById,
    hasPermissions,
    arrayValidFormat
};