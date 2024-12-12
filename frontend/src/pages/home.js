import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import HomeContent from "./homeContent";

const Home = () => {
  return (
    <div className="container-fluid">
      <div className="row">
        <main className="col-12 px-4">
          <HomeContent />
        </main>
      </div>
    </div>
  );
};

export default Home;