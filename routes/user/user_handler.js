const Token = require("../../models/token")
const user = require('./user');
const { v4: uuidv4 } = require('uuid')
var _ = require('lodash');
const fs = require("fs")
var moment = require('moment'); // require
const { isNull } = require("lodash");
moment().format();

module.exports.GetUserData = async (req, res) => {
    const token = req.cookies;
    const decode = await Token.verifyToken(token.userToken);

    user.GetData(decode.email)
        .then(data => {
            if (data === undefined) {
                return res.send({
                    success: false,
                    log: false,
                    msg: "Usted No esta Autenticado"
                })
            }
            else {
                return res.send({
                    success: true,
                    data: data,
                    id: decode.id,
                    log: true,
                    msg: "Usuario Autenticado"
                })
            }
        })
        .catch(err => {
            console.error(err);
            return res.send({
                succes: false,
                msg: "No esta autenticado, hubo un error"
            })
        })
}

module.exports.GetUserAccess = async (req, res) => {
    const token = req.cookies;
    const decode = await Token.verifyToken(token.userToken);

    user.getAccess(decode.id)
        .then(data => {
            if (data === undefined) {
                return res.send({
                    success: false,
                    log: false,
                    msg: "Usted No esta Autenticado"
                })
            }
            else {
                let groupedResults = _.groupBy(data, (data) => moment(data.RegDate, 'DD/MM/YYYY').startOf('isoWeek'));
                result = Object.entries(groupedResults);
                return res.send({
                    success: true,
                    data: result,
                    history: data,
                    id: decode.id,
                    log: true,
                    msg: "Usuario Autenticado"
                })
            }
        })
        .catch(err => {
            console.error(err);
            return res.send({
                succes: false,
                msg: "No esta autenticado, hubo un error"
            })
        })
}

module.exports.GetUsersData = async (_, res) => {
    user.getUsersData()
        .then(data => {
            if (data === undefined) {
                return res.send({
                    success: false,
                    msg: "error al recuperar los usuarios",
                })
            } else {
                return res.send({
                    success: true,
                    msg: "datos recuperados",
                    data: data
                })
            }
        })
}

module.exports.GetUserHistoryData = async (req, res) => {
    user.getAccess4History(req.query.id)
        .then(data => {
            if (data === undefined) {
                return res.send({
                    success: false,
                    msg: "Error el usuario no posee historial"
                })
            } else {
                return res.send({
                    success: true,
                    data: data,
                })
            }
        })
}

module.exports.UpdateData = async (req, res) => {
    const token = req.cookies;
    const decode = await Token.verifyToken(token.userToken);
    const Data = req.body;

    user.updateData(Data, decode.id)
        .then(data => {
            if (data === undefined) {
                return res.send({
                    success: false,
                    log: false,
                    msg: "Hubo un error al Editar su Información"
                })
            }
            else {
                return res.send({
                    success: true,
                    data: data,
                    id: decode.id,
                    log: true,
                    msg: "Datos Actualizados con Exito!"
                })
            }
        })
        .catch(err => {
            console.error(err);
            return res.send({
                succes: false,
                msg: "No fueron actualizados sus datos, hubo un error"
            })
        })
}

module.exports.UpdatePassword = async (req, res) => {
    const token = req.cookies;
    const decode = await Token.verifyToken(token.userToken);
    const Data = req.body;

    user.updatePassword(Data, decode.id)
        .then(data => {
            if (data === undefined) {
                return res.send({
                    success: false,
                    log: false,
                    msg: "Hubo un error al Editar su Clave"
                })
            }
            else if (data.OldPass === false) {
                return res.send({
                    success: false,
                    id: decode.id,
                    log: true,
                    msg: "La Clave Antigua no Coincide"
                })
            }
            else {
                return res.send({
                    success: true,
                    data: data,
                    id: decode.id,
                    log: true,
                    msg: "Datos y Clave Actualizada con Exito!"
                })
            }
        })
        .catch(err => {
            console.error(err);
            return res.send({
                success: false,
                msg: "No fue actualizada su Clave, hubo un error"
            })
        })
}

module.exports.GetProfileData = async (req, res) => {
    const token = req.cookies;
    const decode = await Token.verifyToken(token.userToken);
    let id = "";
    if (req.query.id) {
        id = req.query.id;
    } else {
        id = decode.id;
    }
    user.getFullUserData(id)
        .then(data => {
            if (data === undefined) {
                return res.send({
                    success: false,
                    msg: "error en la peticion"
                })
            } else {
                return res.send({
                    success: true,
                    data: data
                })
            }
        })
}

module.exports.GetSecurityData = async (req, res) => {

    user.getSecurityData(req.id)
        .then(data => {
            if (data === undefined) {
                return res.send({
                    success: false,
                    msg: "error en la peticion"
                })
            } else {
                return res.send({
                    success: true,
                    data: data
                })
            }
        })
}

module.exports.UpdateAuthMethods = async (req, res) => {
    const { id, active } = req.body
    user.UpdateAuth(id, active)
        .then(data => {
            if (data === undefined) {
                return res.send({
                    success: false,
                    msg: "error al actualizar los datos biometricos"
                })
            } else {
                return res.send({
                    success: true,
                    msg: "datos biometricos actualizados satisfactoriamente"
                })
            }
        })
}

module.exports.UpdateProfilePicture = async (req, res) => {
    const { id, actualPicture } = req.body
    const { picture } = req.files
    let uniqueName = uuidv4();
    let imgSource = `/ProfilePictures/${uniqueName}${picture.name.slice(picture.name.indexOf("."))}`

    if (actualPicture !== "null") {
        fs.unlink(`./resources/uploads/${actualPicture}`, err => {
            if (err) {
                console.error("ocurrio un error", err.stack)
            } else {
                user.RemovePicture(id)
                    .then(data => {
                        if (data === undefined) {
                            return res.send({
                                success: false,
                                msg: "error al actualizar la imagen"
                            })
                        } else {
                            picture.mv(`./resources/uploads/ProfilePictures/${uniqueName}${picture.name.slice(picture.name.indexOf("."))}`, err => {
                                if (err) {
                                    console.error(err)
                                } else {
                                    user.UpdatePicture(id, imgSource)
                                        .then(data => {
                                            if (data === undefined) {
                                                return res.send({
                                                    success: false,
                                                    msg: "error al actualizar la imagen"
                                                })
                                            } else {
                                                return res.send({
                                                    success: true,
                                                    msg: "imagen actualizada correctamente"
                                                })
                                            }
                                        })
                                }
                            })
                        }
                    })
            }
        })
    } else {
        picture.mv(`./resources/uploads/ProfilePictures/${uniqueName}${picture.name.slice(picture.name.indexOf("."))}`, err => {
            if (err) {
                console.error(err)
            } else {
                user.UpdatePicture(id, imgSource)
                    .then(data => {
                        if (data === undefined) {
                            return res.send({
                                success: false,
                                msg: "error al actualizar la imagen"
                            })
                        } else {
                            return res.send({
                                success: true,
                                msg: "imagen actualizada correctamente"
                            })
                        }
                    })
            }
        })
    }
}

module.exports.DeletePicture = (req, res) => {
    const data = req.body

    fs.unlink(`./resources/uploads/${data.actualPicture}`, err => {
        if (err) console.error("ocurrio un error", err.stack)
        else {
            user.RemovePicture(data)
                .then(data => {
                    if (data === undefined) {
                        return res.send({
                            success: false,
                            msg: "error al eliminar la foto"
                        })
                    } else {
                        return res.send({
                            success: true,
                            msg: "foto eliminada correctamente"
                        })
                    }
                })
        }
    })
}

module.exports.InSession = async (req, res, next) => {
    const token = req.cookies;
    const decode = await Token.verifyToken(token.userToken);

    user.inSession(decode.id,token.userToken)
        .then(data => {
            if (data === false || data === undefined) {
                return res.status(401).send({
                    msg: "No tienes acceso que triste :<"
                })
            }
            else {
                next();
            }
        })
        .catch(err => {
            console.error(err);
            return res.send({
                succes: false,
                log: false,
                msg: "No se comprobo la sesion, hubo un error, hubo un error"
            })
        })
}
