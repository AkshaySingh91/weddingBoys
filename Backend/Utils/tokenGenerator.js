import jwt from 'jsonwebtoken'

export default function tokenGenerator(payload, expiresIn){
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, {
        expiresIn : expiresIn
    })
}
