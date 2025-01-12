const accounts: {val: number}[] = [{val: 1}, {val: 2}, {val: 3}]

for(let i = 0; i < accounts.length; i++) {
    let account = accounts[i];
    account.val += 1;
}

console.log(accounts)
