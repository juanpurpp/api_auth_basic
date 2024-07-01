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
    const { q, active, login_before_date, login_after_date } = req.query;
    const where = { //using conditional prop technique, if variable is passed then is added to where object only if exists
        ...( q && { name: { [db.Sequelize.Op.like]: `%${q}%` }}),
        ...( active === 'true' || active === 1 && { status: 0 }),
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
                            ... login_before_date ? [{ [db.Sequelize.Op.lt]: login_before_date }] : [],
                            ... login_after_date ? [{ [db.Sequelize.Op.gt]: login_after_date }] : [],
                        ]
                    }
                }
            }]
        })
    };
}
const bulkCreate = async (req) => {
    const users = await Promise.all(req.locals.load.map(
        async user => ({
            name: user.name,
            email: user.email,
            password: await bcrypt.hash(user.password, 10),
            cellphone: user.cellphone,
            status: true
        })
    ))
    await db.User.bulkCreate(users);
    return {
        code: 200,
        message: `${req.locals.load.length} users created successfully. ${req.locals.eliminated} were not created due to invalid data.`
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
    bulkCreate,
    getUserById,
    getAllActiveUsers,
    findUsers,
    updateUser,
    deleteUser,
}