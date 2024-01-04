import { exec } from 'child_process';
import { Command } from 'commander';
import readline from 'readline';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import 'dotenv/config';


const program = new Command();
program
  .option('-b, --backup', 'Create a backup')
  .option('-r, --restore', 'Restore from a backup')
  .parse();

const options = program.opts();

const HOST = process.env.DB_HOST;
const PORT = process.env.DB_PORT;
const USER = process.env.DB_USER;
const DATABASE = process.env.DB_NAME;
const BACKUP_PATH = process.env.BACKUP_PATH;

const DB_RESTORE_HOST = process.env.DB_RESTORE_HOST || 'localhost';
const DB_RESTORE_PORT = process.env.DB_RESTORE_PORT || '5432';
const DB_RESTORE_USER = process.env.DB_RESTORE_USER || 'postgres';
const DB_RESTORE_NAME = process.env.DB_RESTORE_NAME || 'vendmine_dev';
const DB_RESTORE_PASSWORD = process.env.DB_RESTORE_PASSWORD || 'postgres';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});



const getFormattedDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

const runCommand = (command: string, spinner: Ora, message: string) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        spinner.fail('Error in: ' + chalk.red(message));
        reject(error);
      } else {
        spinner.succeed('Completed: ' + chalk.green(message));
        resolve(stdout);
      }
    });
  });
};


const dropExistingTables = async (restockDBName: string, restockDBHost: string, restockDBPort: string, restockDBUser: string, restockDBPassword: string) => {
  const restoreSpinner = ora('Starting drop existing table process').start();
  const dropTablesCommand = `docker run --rm -e PGPASSWORD=${restockDBPassword} -v "$(pwd)":/currentdir -v ${BACKUP_PATH}:/backups postgres psql -h ${restockDBHost} -p ${restockDBPort} -U ${restockDBUser} -d ${restockDBName} -f /currentdir/drop_tables.sql`;
  await runCommand(dropTablesCommand, restoreSpinner, 'Drop existing tables');
};

const confirmAction = async (message: string) => {
  return new Promise((resolve) => {
    rl.question(chalk.blue(message), (answer) => {
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
};

const askForBackupFileName = async (defaultName: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(chalk.yellow(`Enter the backup file name [${defaultName}]: `), (input) => {
      resolve(input.trim() || defaultName);
    });
  });
};

const backupAndRestore = async () => {
  console.time('Total Time');
  const timestamp = getFormattedDate();

  try {
    if (options.backup) {
      const backupSpinner = ora('Starting schema backup process').start();
      await runCommand(`docker run --rm -e PGPASSWORD=${process.env.DB_PASSWORD} -v ${BACKUP_PATH}:/backups postgres pg_dump -h ${HOST} -p ${PORT} -U ${USER} --schema-only -f /backups/backup_schema_${timestamp}.sql ${DATABASE}`, backupSpinner, 'Backup schema');
      const backupDataSpinner = ora('Starting data backup process').start();
      await runCommand(`docker run --rm -e PGPASSWORD=${process.env.DB_PASSWORD} -v ${BACKUP_PATH}:/backups postgres pg_dump -h ${HOST} -p ${PORT} -U ${USER} --data-only -f /backups/backup_data_${timestamp}.sql ${DATABASE}`, backupDataSpinner, 'Backup data');

    }

    if (options.restore) {
      let defaultSchemaFileName = `backup_schema_${timestamp}.sql`;
      let defaultDataFileName = `backup_data_${timestamp}.sql`;
      if (!options.backup) {
        defaultSchemaFileName = await askForBackupFileName(defaultSchemaFileName);
        defaultDataFileName = await askForBackupFileName(defaultDataFileName);
      }

      console.log(chalk.blueBright(`Backup will be restored to the database ${chalk.white(DB_RESTORE_NAME)} in ${chalk.white(DB_RESTORE_PORT)} from /backups/${defaultSchemaFileName} and /backups/${defaultDataFileName}.`));
      const isConfirmed = await confirmAction('Are you sure you want to continue? (yes/no): ');

      if (!isConfirmed) {
        console.log(chalk.red('Process cancelled by the user.'));
        return;
      }

      await dropExistingTables(DB_RESTORE_NAME, DB_RESTORE_HOST, DB_RESTORE_PORT, DB_RESTORE_USER, DB_RESTORE_PASSWORD);
      const restoreSchema = `docker run --rm -e PGPASSWORD=${DB_RESTORE_PASSWORD} -v ${BACKUP_PATH}:/backups postgres psql -h ${DB_RESTORE_HOST} -p ${DB_RESTORE_PORT} -U ${DB_RESTORE_USER} -d ${DB_RESTORE_NAME} -a -f /backups/${defaultSchemaFileName}`;
      await runCommand(restoreSchema, ora('Starting schema restore process').start(), 'Restore schema');

      const restoreData = `docker run --rm -e PGPASSWORD=${DB_RESTORE_PASSWORD} -v ${BACKUP_PATH}:/backups postgres psql -h ${DB_RESTORE_HOST} -p ${DB_RESTORE_PORT} -U ${DB_RESTORE_USER} -d ${DB_RESTORE_NAME} -a -f /backups/${defaultDataFileName}`;
      await runCommand(restoreData, ora('Starting data restore process').start(), 'Restore data');
    }

  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
  } finally {
    rl.close();
    console.timeEnd('Total Time');
    console.log(chalk.green('🎉 Process completed successfully!'));
  }
};

backupAndRestore();
