interface Base {
    collection: string[]
}

const base: Base = {
    collection: []
}

const item1 = {
    id: 1,
    ...base,
}

const item2 = {
    id: 2,
    ...base,
}

item1.collection.push('test')

console.log(item1)
console.log(item2)

const item3 = {
    id: 3,
    ...JSON.parse(JSON.stringify(base)),
}

item3.collection.push('test123')

console.log(item1)
console.log(item2)
console.log(item3)
