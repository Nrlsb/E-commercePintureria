// src/components/AnimatedNumber.jsx
import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

/**
 * Componente que anima el cambio de un número.
 * @param {object} props
 * @param {number} props.value - El valor numérico a mostrar y animar.
 */
const AnimatedNumber = ({ value }) => {
  // Usamos useSpring para una animación suave
  const spring = useSpring(value, { mass: 0.8, stiffness: 100, damping: 15 });

  // Transformamos el valor del resorte para formatearlo como moneda
  const display = useTransform(spring, (current) =>
    new Intl.NumberFormat('es-AR').format(current.toFixed(2))
  );

  // Actualizamos el valor del resorte cuando la prop 'value' cambia
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
};

export default AnimatedNumber;
