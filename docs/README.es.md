# OpenCrew

OpenCrew es una GitHub Action transparente para recibir, asignar y orientar a quienes contribuyen a proyectos open source.

Reúne tareas que normalmente requieren varios bots:

- comandos `/claim` y `/unclaim`;
- límite configurable de issues por persona;
- liberación automática de asignaciones inactivas;
- bienvenida al primer pull request;
- validación de referencias a issues, rama de destino y secciones obligatorias;
- mensajes en inglés y español;
- reglas deterministas, sin IA y sin ejecutar código del pull request.

## Desarrollo local

```bash
npm install
npm test
npm run build
```

Consulta el [README principal](../README.md) para ver la configuración y los permisos requeridos.

## Cómo contribuir

Se pueden realizar contribuciones pequeñas y útiles: traducciones, reglas, pruebas, documentación, accesibilidad e integraciones. Antes de abrir un PR, lee [CONTRIBUTING.md](../CONTRIBUTING.md).
