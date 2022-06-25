defmodule APIRouter.SettingsRouter do
  import APIRouter.Responder, only: [respond: 2]
  use Plug.Router

  plug(:match)
  plug(:dispatch)

  get "/" do
    respond(
      conn,
      Mongo.find_one(:mongo, "settings", %{guild: conn.params["id"]}, projection: %{_id: 0})
    )
  end

  get "/:setting" do
    respond(
      conn,
      Mongo.find_one(:mongo, "settings", %{guild: conn.params["id"]},
        projection: %{"#{setting}": 1, _id: 0}
      )
    )
  end
end
