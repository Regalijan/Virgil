defmodule APIRouter.BindRouter do
  import APIRouter.Responder, only: [respond: 2]
  use Plug.Router

  plug(:match)
  plug(:dispatch)

  get "/" do
    respond(
      conn,
      Mongo.find(:mongo, "binds", %{server: conn.params["id"]}, projection: %{_id: 0})
    )
  end

  get "/:bind" do
    respond(
      conn,
      Mongo.find_one(:mongo, "binds", %{server: conn.params["id"]})
    )
  end
end
