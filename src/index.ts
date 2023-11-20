import config from './config.json'
import fs from 'fs';
import path from 'path';
import { generateApi } from 'swagger-typescript-api';
import axios from 'axios';
import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface DocConfig {
  url: string;
  output?: string;
  name: string;
}

interface Config {
  output: string;
  docs: DocConfig[];
}
// ...其他函数和逻辑保持不变

// json文件请求
async function downloadJson(
  url: string,
) {
  // const url = `${BASEURL}${URLPATH}`;
  try {
      console.log(url)
      const response = await axios.get(url);
      if (response.status === 200) {
          return response
      } else {
          console.error(`Failed to download file: status code ${response.status}`);
          return false
      }
  } catch (error) {
      console.error(`Failed to download file: ${error}`);
      return false
  }
}
// json文件保存到对应文件夹
function saveFile(jsonData: any, output: string, name: string) {

  const directoryPath = path.resolve(__dirname, '..', output);

  if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
  }

  const filepath = path.resolve(directoryPath, `${name}.json`);
  fs.writeFileSync(filepath, JSON.stringify(jsonData, null, 2));

  generateApiFiles(filepath, directoryPath, name).then(() => {
      console.log('API generated successfully.');
  }).catch(error => {
      console.error(`Failed to generate API: ${error}`);
  });

}

async function generateApiFiles(url: string, outputPath: string, name: string) {
  try {
    const { files, configuration } = await generateApi({
      name: `${name}.ts`,
      output: path.resolve(outputPath),
      // url: url,
      // url与input二选一即可
      input: path.resolve(url),
      httpClientType: "axios",
      singleHttpClient: true,
      generateResponses: true,
      unwrapResponseData: false,
      prettier: {
        printWidth: 120,
        tabWidth: 2,
        trailingComma: "all",
        parser: "typescript",
      },
      defaultResponseType: "void",
      // moduleNameFirstTag: true,  // 使每个tag成为一个模块
      modular: true,
      // templates: path.resolve(__dirname, './templates'),
      hooks: {
        onCreateRoute: (routeData) => {
          // console.log('onCreateRoute', routeData)
          routeData.namespace = name
          return routeData
        },
      }
      
    });
    files.forEach(({ fileContent, fileName }: any, index: number) => {
      if (fileName) {
        const filePath = path.join(outputPath, fileName + ".ts");
        fs.writeFileSync(filePath as string, fileContent as Buffer);
      } else {
        const filePath = path.join(outputPath, "undefined" + index + ".ts");
        fs.writeFileSync(filePath as string, fileContent as Buffer);
      }
    });
  } catch (e) {
    console.error(e);
  }
}

function genapi(config: Config) {
  config.docs.forEach(async (doc: DocConfig) => {
    // Use the doc-specific output or fallback to the config-wide output
    const output = doc.output || config.output;
    const response = await downloadJson(doc.url);
    if (response) {
      saveFile(response.data, output, doc.name);
    }
  });
}

genapi(config)