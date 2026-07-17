const inputDataSource1 = {
  transactions: [
    {
      type: "paid",
      amount: 100,
      currency: "USD",
    },
    {
      type: "pending",
      amount: 50,
      currency: "USD",
    },
    {
      type: "paid",
      amount: 880,
      currency: "USD",
    },
    {
      type: "paid",
      amount: 130,
      currency: "USD",
    },
    {
      type: "rejected",
      amount: 560,
      currency: "USD",
    },
  ],
  address: {
    city: "New York",
    street: "5th Avenue",
    houseNumber: 10,
  },
};

const inputDataSource2 = ["300 USD", "150 USD", "200 USD", "400 USD"];

// console.log(
//   "Input Data Source 1:",
//   inputDataSource1.transactions.forEach((item) => {
//     if (item.type === "paid") console.log(item);
//   }),
// );
// console.log(
//   "Input Data Source 2:",
//   inputDataSource2.forEach((item) => console.log(item)),
// );

// Функция, которая принимает данные из обоих источников и рассчитывает общую выручку за день.
// При этом возвращает данные в формате:
// {
//    total: 5000,
//    currency: "USD"
// }

function calculateTotalRevenue(dataSource1, dataSource2) {
  let totalRevenue = 0;
  let currency = "USD"; // Валюта для всех источников данных, предполагаем, что она одинакова

  // Считаем общую выручку из dataSource1
  dataSource1.transactions.forEach((transaction) => {
    if (transaction.type === "paid") {
      totalRevenue += transaction.amount;
    }
  });

  // Считаем общую выручку из dataSource2
  dataSource2.forEach((item) => {
    const amount = parseInt(item.split(" ")[0]);
    totalRevenue += amount;
  });

  return { total: totalRevenue, currency };
}

const result = calculateTotalRevenue(inputDataSource1, inputDataSource2);
console.log(result);
