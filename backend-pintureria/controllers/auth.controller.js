// backend-pintureria/controllers/auth.controller.js
import * as authService from '../services/auth.service.js';
import { getIoInstance } from '../socket.js'; // 1. Importar la instancia de socket

export const registerUser = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    
    // 2. Emitir evento de nuevo usuario a los administradores
    const io = getIoInstance();
    io.to('admins').emit('new_user', { email: user.email });

    res.status(201).json({ message: 'Usuario registrado con éxito', user });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const data = await authService.login(email, password);
    res.json(data);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const message = await authService.forgotPassword(email);
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const message = await authService.resetPassword(token, password);
    res.status(200).json({ message });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const userId = req.user.userId; 
    const newToken = await authService.refreshToken(userId);
    res.json({ token: newToken });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
};
