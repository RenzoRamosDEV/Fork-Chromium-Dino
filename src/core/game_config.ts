// Copyright 2025 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Configuración base compartida por todos los modos de juego.
// Se combina con GameModeConfig (normal o lento) para formar Config completa.
export interface BaseConfig {
  // Distancia en píxeles a la que se activa el aviso de audio (a11y) antes del obstáculo.
  audiocueProximityThreshold: number;
  // Versión más amplia del threshold anterior para móviles con a11y activada.
  audiocueProximityThresholdMobileA11y: number;
  // Velocidad base de las nubes en el fondo.
  bgCloudSpeed: number;
  // Margen inferior del dinosaurio respecto al suelo (en píxeles).
  bottomPad: number;
  // Desplazamiento Y mínimo del canvas para que el juego pueda activarse con scroll.
  canvasInViewOffset: number;
  // Milisegundos de "calentamiento" antes de que aparezca el primer obstáculo.
  clearTime: number;
  // Probabilidad (0-1) de que aparezca una nube en cada frame que toca.
  cloudFrequency: number;
  // Duración del fade-in al cambiar de modo de juego alternativo (en segundos).
  fadeDuration: number;
  // Duración del parpadeo del dino al recoger un coleccionable (ms).
  flashDuration: number;
  // Milisegundos mínimos tras game over antes de poder reiniciar con espacio/salto.
  gameoverClearTime: number;
  // Velocidad inicial del salto (valor absoluto; se aplica negativo).
  initialJumpVelocity: number;
  // Duración en ms del efecto de inversión de colores (modo noche).
  invertFadeDuration: number;
  // Número máximo de parpadeos del dino en espera antes de dejar de actualizar.
  maxBlinkCount: number;
  // Número máximo de nubes simultáneas en pantalla.
  maxClouds: number;
  // Máximo número de obstáculos agrupados (p.ej. 3 cactus seguidos).
  maxObstacleLength: number;
  // Máximo de obstáculos del mismo tipo consecutivos permitidos.
  maxObstacleDuplication: number;
  // ID del <template> HTML que contiene los elementos <audio>.
  resourceTemplateId: string;
  // Velocidad inicial de desplazamiento del escenario.
  speed: number;
  // Factor por el que se multiplica la velocidad de caída al presionar abajo en el aire.
  speedDropCoefficient: number;
  // Posición Y inicial del contenedor en modo arcade (chrome://dino).
  arcadeModeInitialTopPosition: number;
  // Porcentaje de la ventana que ocupa el juego verticalmente en modo arcade.
  arcadeModeTopPositionPercent: number;
}

// Parámetros que varían entre el modo normal y el modo lento (para a11y).
export interface GameModeConfig {
  // Incremento de velocidad por frame hasta alcanzar maxSpeed.
  acceleration: number;
  audiocueProximityThreshold: number;
  audiocueProximityThresholdMobileA11y: number;
  // Multiplicador del gap mínimo entre obstáculos.
  gapCoefficient: number;
  // Distancia recorrida (en unidades reales) entre cada inversión de colores.
  invertDistance: number;
  // Velocidad máxima del escenario.
  maxSpeed: number;
  // Coeficiente que reduce la velocidad en pantallas móviles pequeñas.
  mobileSpeedCoefficient: number;
  speed: number;
}

// Config final = unión de BaseConfig + GameModeConfig.
export type Config = BaseConfig&GameModeConfig;

// Interfaz que implementa Runner para que los subcomponentes lean la configuración activa.
export interface ConfigProvider {
  getConfig(): Config;
}
