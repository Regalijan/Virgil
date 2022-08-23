defmodule APIRouter.APIKeysRouter do
  import APIRouter.Responder, only: [respond: 2]
  use Plug.Router

  plug(:match)
  plug(:dispatch)

  get "/" do
    respond(
      conn,
      %{success: true}
    )
  end
end
