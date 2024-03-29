defmodule APIRouter do
  use Plug.Router
  use Plug.ErrorHandler

  plug(Plug.TokenAuth)
  plug(Plug.Scope)

  plug(Plug.Parsers,
    parsers: [:json],
    json_decoder: Jason
  )

  plug(:match)
  plug(:dispatch)

  forward("/guild/:id/api-keys", to: APIRouter.APIKeysRouter)
  forward("/guild/:id/binds", to: APIRouter.BindRouter)
  forward("/guild/:id/ignored", to: APIRouter.IgnoredRouter)
  forward("/guild/:id/settings", to: APIRouter.SettingsRouter)

  match _ do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(404, "{\"error\":\"Not found\"}")
  end

  @impl Plug.ErrorHandler
  def handle_errors(conn, %{kind: _kind, reason: _reason, stack: _stack}) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(500, "{\"error\":\"Internal server error\"}")
  end
end
