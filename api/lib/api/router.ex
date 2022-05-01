# This is for another service, such as a dashboard, to modify and retrieve settings. It is not made to be a public api.

defmodule APIRouter do
  use Plug.Router
  use Plug.ErrorHandler

  plug(Plug.TokenAuth)
  plug(Plug.UpdateBSONValidator)

  plug(Plug.Parsers,
    parsers: [:json],
    json_decoder: Jason
  )

  plug(:match)
  plug(:dispatch)

  defp respond(conn, status, body) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(status, Jason.encode!(body))
    |> halt
  end

  defp set_guild_id(body_params, gid) do
    cond do
      !Map.has_key?(body_params, "guild") -> Map.merge(body_params, %{guild: gid})
      Map.get(body_params, "guild") !== gid -> Map.replace!(body_params, "guild", gid)
      true -> body_params
    end
  end

  get "/guild/:id" do
    doc = Mongo.find_one(:mongo, "settings", %{guild: id})

    {status, body} =
      cond do
        is_tuple(doc) -> {500, %{error: "Failed to fetch guild settings"}}
        is_nil(doc) -> {404, %{error: "No settings found for guild"}}
        true -> {200, Map.delete(doc, "_id")}
      end

    respond(conn, status, body)
  end

  put "/guild/:id" do
    doc = set_guild_id(conn.body_params, id)

    Mongo.replace_one!(:mongo, "settings", %{guild: id}, doc, upsert: true)
    respond(conn, 200, %{success: true})
  end

  patch "/guild/:id" do
    {s, result} = Mongo.update_one(:mongo, "settings", %{guild: id}, conn.assigns[:upd_doc])

    {status, body} =
      cond do
        s !== :ok -> {500, %{error: "Failed to update guild settings"}}
        result.matched_count > 0 -> {200, %{success: true}}
        true -> {404, %{error: "No existing settings for guild"}}
      end

    respond(conn, status, body)
  end

  match _ do
    respond(conn, 404, %{error: "Not found"})
  end

  @impl Plug.ErrorHandler
  def handle_errors(conn, %{kind: _kind, reason: _reason, stack: _stack}) do
    respond(conn, 500, %{error: "Internal server error"})
  end
end
