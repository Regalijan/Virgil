defmodule APIRouter.IgnoredRouter do
  import APIRouter.Responder, only: [respond: 2]
  use Plug.Router

  plug(:match)
  plug(:dispatch)

  get "/" do
    respond(
      conn,
      Mongo.find(:mongo, "ignored", %{guild: conn.params["id"]}, projection: %{_id: 0})
    )
  end

  get "/:channel" do
    respond(
      conn,
      Mongo.find_one(:mongo, "ignored", %{guild: conn.params["id"], channel: channel},
        projection: %{_id: 0}
      )
    )
  end
end
