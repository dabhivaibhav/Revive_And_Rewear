
REVIVE AND REWEAR

A group project for Advanced Software Engineering Course(IT426)

INTRODUCTION

In a world where fast fashion plays a significant role in the environment degradation, Revive & Rewear offers the best alternative where users can buy or sell the preloved clothes. The platform's user-friendly structure is intended to motivate people to give their gently used clothing a fresh start of life. The goal is simple but powerful, providing an efficient way for consumers to trade in gently used clothing, thereby reducing waste and contributing in a great extent to the circular fashion economy. The system differentiates between the buyer, seller and administrator by implementing a solid role management, ensuring that each user has their appropriate access and rights, thereby improving the security and leveraging the user experience.

Any individual can start their shopping journey by registering, where they can create an account by setting up an authentication to ensure that the platform can be used only by the authorized users. A centralized dashboard provides both buyers and sellers with an intuitive interface to manage their profiles, products, orders and categories ensuring a smooth experience from start to finish.

R & R aims to keep things simple and easy to use with tools like seller inventory control, product uploads, and user profile management. It’s more than just a market place for buying and selling. Every item listed by seller goes through a review process by the administrator to make sure it meets the quality standards while allowing users to search, filter, sort, add products to their cart, make purchases, manage payment methods, track orders, and process returns or cancellations seamlessly. As we dive more into this project, the further sections demonstrates how each functionality, guiding developers and designers contributed in bringing Revive & Rewear to life, adhering to its principles of sustainable fashion and innovation.

MVC X LAYERED ARCHITECTURE

 ![ntier](https://github.com/user-attachments/assets/64e7421c-e922-4219-a9aa-5f3c05b38f4b)


This architecture follows the N-tier design, which improves maintainability and scalability by giving each layer a distinct role. Using the MVC framework, the Presentation Layer presents data to the user through interfaces such as the Register, Login, and Product Catalog, with controllers handling user inputs. The business logic is managed by the Application Layer via a number of services, including user, product, and authentication management. It serves as an an intermediary between the user interface and the data, sending requests to an appropriate service for processing. The primary business logic is carried out in the Service Layer, which interacts with the Data Layer to handle the retrieval and storing of data in entities such as Users, Products, and Orders. The data access layer, which communicates with the underlying database, is responsible for modifying or accessing data, while the service layer applies business rules to guarantee that user interactions are processed effectively. This design promotes modularity and easier management of complex systems.


