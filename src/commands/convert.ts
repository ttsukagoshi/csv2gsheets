type CommandOptions = {
  readonly cwd?: string; // [test] Current working directory
};

export default async function (options: CommandOptions): Promise<void> {
  console.log('running convert. options:', options); // [test]
}
