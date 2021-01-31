const User = require('../../models/User');
const bcrypt = require('bcryptjs');

exports.signup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    const birthday = req.body.birthday;
    const location = req.body.location;
    const zipcode = req.body.zipcode;

    User.findOne({ $or: [{ username: username }, { email: email }] })
        .then(
            (user) => {
                if (user) {const error = new Error("username or email exists please try a different one")
                error.statusCode = 401;
                res.status(400).json({message:'username or email exists please try a different one'});
                throw error;  
                }
                bcrypt.hash(password, 12).then(hashed => {
                    const user = new User({
                        email: email,
                        password: hashed,
                        username: username,
                        birthday: birthday,
                        location: location,
                        zipcode: zipcode,
                        role: 'ROLE_USER'
                    });
                    return user.save();
                }).
                    then(result => {
                        res.status(200).json({ message: 'You have successfully signed up' });
                    }).catch(err => {
                        if (err._message) {
                            res.status(401).json({ message: `${err._message} please make to sure to fill out all the fields` });
                        }
                        else {
                            res.status(500).json({ message: 'Opps something went wrong please try again' });
                        }
                    });
            }
        ).catch(err => {
            if(!err.statusCode){
                err.statusCode=500;
                next(err);
            }
        })


}
