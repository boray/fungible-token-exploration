import { Token } from './Token.js';
import { AccountUpdate, Mina, PrivateKey, UInt64 } from 'o1js';

// setup
const Local = await Mina.LocalBlockchain({proofsEnabled: true});
Mina.setActiveInstance(Local);

const [sender, account1, account2, account3, account4] = Local.testAccounts;
const senderKey = sender.key;

const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();
const zkApp = new Token(zkAppAddress);

// compile
await Token.compile();
console.log(Token._verificationKey?.hash.toString());

console.time('Deploying Token');

let tx = await Mina.transaction(sender, async () => {
  AccountUpdate.fundNewAccount(sender,3);
  await zkApp.deploy();
});
await tx.prove();
await tx.sign([zkAppPrivateKey, senderKey]).send();
console.timeEnd('Deploying Token');


console.time('First Transaction');
try {
  let tx = await Mina.transaction(sender, async () => {
    AccountUpdate.fundNewAccount(sender);
    await zkApp.transfer(zkAppAddress, account1, UInt64.from(1000));
  });
  await tx.prove();
  await tx.sign([zkAppPrivateKey,senderKey]).send();
} catch (err) {
  console.log('Something went terribly wrong! Execute rm -rf immediately!');
  console.log(err);
}
console.timeEnd('First Transaction');


console.time('Second Transaction');
try {
  let tx = await Mina.transaction(account1, async () => {
    AccountUpdate.fundNewAccount(account1);
    await zkApp.transfer(account1, account2, UInt64.from(500));
  });
  await tx.prove();
  await tx.sign([account1.key]).send();
} catch (err) {
  console.log('Something went terribly wrong! Execute rm -rf immediately!');
  console.log(err);
}
console.timeEnd('Second Transaction');


console.time('Third Transaction');
try {
  let tx = await Mina.transaction(account2, async () => {
    AccountUpdate.fundNewAccount(account2);
    await zkApp.transfer(account2, account3, UInt64.from(250));
  });
  await tx.prove();
  await tx.sign([account2.key]).send();
} catch (err) {
  console.log('Something went terribly wrong! Execute rm -rf immediately!');
  console.log(err);
}
console.timeEnd('Third Transaction');


/*
console.time('This must fail');
try {
  let tx = await Mina.transaction(account2, async () => {
    await zkApp.transfer(account2, account3, UInt64.from(1000));
  });
  await tx.prove();
  await tx.sign([account2.key]).send();
} catch (err) {
  console.log(err);
}
console.timeEnd('This must fail');
*/
console.time('fail?');
try {
  let tx = await Mina.transaction(account1, async () => {
    await zkApp.transfer(account1, account3, UInt64.from(100));
    await zkApp.transfer(account1, account2, UInt64.from(100));

  });
  await tx.prove();
  await tx.sign([account1.key]).send();
} catch (err) {
  console.log(err);
}
console.timeEnd('fail?');

console.time('fail?');
try {
  let tx = await Mina.transaction(account1, async () => {
    AccountUpdate.fundNewAccount(account1);
    await zkApp.transfer(account1, account4, UInt64.from(100));
    await zkApp.transfer(account4, account2, UInt64.from(100));

  });
  await tx.prove();
  await tx.sign([account1.key, account4.key]).send();
} catch (err) {
  console.log(err);
}
console.timeEnd('fail?');


