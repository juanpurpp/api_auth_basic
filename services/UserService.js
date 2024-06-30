import db from '../dist/db/models/index.js';
import bcrypt from 'bcrypt';

const createUser = async (req) => {
    const {
        name,
        email,
        password,
        password_second,
        cellphone
    } = req.body;
    if (password !== password_second) {
        return {
            code: 400,
            message: 'Passwords do not match'
        };
    }
    const user = await db.User.findOne({
        where: {
            email: email
        }
    });
    if (user) {
        return {
            code: 400,
            message: 'User already exists'
        };
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.User.create({
        name,
        email,
        password: encryptedPassword,
        cellphone,
        status: true
    });
    return {
        code: 200,
        message: 'User created successfully with ID: ' + newUser.id,
    }
};

const getUserById = async (id) => {
    return {
        code: 200,
        message: await db.User.findOne({
            where: {
                id: id,
                status: true,
            }
        })
    };
}

const getAllActiveUsers = async () => {
    return {
        code: 200,
        message: await db.User.findAll({
            where: {
                status: 1
            }
        })
    };

}
const findUsers = async (req) => {
    const { q, deleted, connectedBefore, connectedAfter } = req.query;
    const where = { //using conditional prop technique, if variable is passed then is added to where object only if exists
        ...( q && { name: { [db.Sequelize.Op.like]: `%${q}%` }}),
        ...( deleted === 'true' || deleted === 1 && { status: 0 }),
    };
    return {
        code: 200,
        message: await db.User.findAll({
            where: where,
            include: [{
                model: db.Session,
                attributes: [], //excluding session data so we dont expose tokens'
                where: { // using conditional prop technique also
                    createdAt:{
                        [db.Sequelize.Op.and]:[
                            ... connectedBefore ? [{ [db.Sequelize.Op.lt]: connectedBefore }] : [],
                            ... connectedAfter ? [{ [db.Sequelize.Op.gt]: connectedAfter }] : [],
                        ]
                    }
                }
            }]
        })
    };
}
const updateUser = async (req) => {
    const user = db.User.findOne({
        where: {
            id: req.params.id,
            status: true,
        }
    });
    const payload = {};
    payload.name = req.body.name ?? user.name;
    payload.password = req.body.password ? await bcrypt.hash(req.body.password, 10) : user.password;
    payload.cellphone = req.body.cellphone ?? user.cellphone;
    await db.User.update(payload, {
        where: {
            id: req.params.id
        }

    });
    return {
        code: 200,
        message: 'User updated successfully'
    };
}

const deleteUser = async (id) => {
    /* await db.User.destroy({
        where: {
            id: id
        }
    }); */
    const user = db.User.findOne({
        where: {
            id: id,
            status: true,
        }
    });
    await  db.User.update({
        status: false
    }, {
        where: {
            id: id
        }
    });
    return {
        code: 200,
        message: 'User deleted successfully'
    };
}

export default {
    createUser,
    getUserById,
    getAllActiveUsers,
    findUsers,
    updateUser,
    deleteUser,
}