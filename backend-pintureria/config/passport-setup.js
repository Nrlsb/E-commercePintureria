// backend-pintureria/config/passport-setup.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import * as authService from '../services/auth.service.js';
import config from './index.js';
import logger from '../logger.js';

passport.use(
  new GoogleStrategy(
    {
      // Opciones para la estrategia de Google
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: '/api/auth/google/callback',
      scope: ['profile', 'email'], // Solicitamos el perfil y el email del usuario
    },
    async (accessToken, refreshToken, profile, done) => {
      // Esta función se ejecuta cuando Google nos devuelve el perfil del usuario
      try {
        const user = await authService.findOrCreateGoogleUser(profile);
        // Si encontramos o creamos el usuario, lo pasamos a passport
        done(null, user);
      } catch (err) {
        logger.error('Error en la estrategia de Google Passport:', err);
        done(err, null);
      }
    }
  )
);

// Passport no necesita serializar/deserializar usuarios en una sesión JWT
// por lo que estas funciones pueden dejarse vacías o simplemente no definirse.
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
    // Esta lógica dependería de si usas sesiones, con JWT no es necesaria.
    done(null, { id });
});
