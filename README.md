# copy-db

`copy-db` es una herramienta de línea de comandos diseñada para facilitar el proceso de backup y restauración de bases de datos PostgreSQL. Utiliza Bun, un entorno de ejecución de JavaScript y TypeScript, para una ejecución rápida y eficiente. Además, se apoya en Docker para manejar las operaciones de base de datos de forma aislada y segura.

## Requisitos Previos

Antes de utilizar `copy-db`, asegúrate de tener instalado lo siguiente:

- [Bun](https://bun.sh/): Un entorno de ejecución de JavaScript y TypeScript. Sigue las instrucciones de instalación en su página web.
- [Docker](https://www.docker.com/): Necesario para ejecutar las operaciones de base de datos en contenedores aislados. Instala Docker Desktop o Docker Engine dependiendo de tu sistema operativo.

## Configuración

1. **Clonar el repositorio**: Clona este repositorio a tu máquina local utilizando `git clone`.

2. **Variables de entorno**: Configura las variables de entorno necesarias. Puedes hacerlo creando un archivo `.env` en la raíz del proyecto con el siguiente contenido:

    ```env
    DB_HOST=tu_host_de_base_de_datos
    DB_PORT=tu_puerto_de_base_de_datos
    DB_USER=tu_usuario_de_base_de_datos
    DB_NAME=nombre_de_tu_base_de_datos
    BACKUP_PATH=ruta_para_guardar_backups

    # Para la restauración
    DB_RESTORE_HOST=host_de_restauración
    DB_RESTORE_PORT=puerto_de_restauración
    DB_RESTORE_USER=usuario_de_restauración
    DB_RESTORE_NAME=nombre_de_base_de_datos_para_restaurar
    DB_RESTORE_PASSWORD=contraseña_de_restauración
    ```

    Reemplaza los valores según corresponda a tu configuración.

3. **Instalar dependencias**: Ejecuta `bun install` en la raíz del proyecto para instalar las dependencias necesarias.

## Uso

`copy-db` ofrece dos funcionalidades principales: backup y restauración de bases de datos.

- **Backup**: Para crear un backup de tu base de datos, ejecuta el siguiente comando:

  ```bash
  bun run index --backup
